package com.example.researchreview.services.impl

import com.example.researchreview.configs.CacheNames
import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.repositories.TemplateRepository
import com.example.researchreview.services.S3Service
import com.example.researchreview.services.TemplateService
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.owasp.html.HtmlPolicyBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.CachePut
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.Caching
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.time.LocalDateTime

@Service
class TemplateServiceImpl @Autowired constructor(
    private val templateRepository: TemplateRepository,
    private val s3Service: S3Service,
    private val stringTemplateEngine: TemplateEngine,
    @param:Value("\${aws.s3.bucket-name:research-review-templates}") private val bucketName: String
) : TemplateService {
    private fun getBoilerplateHtml(): String {
        // Read from classpath instead of filesystem
        return this::class.java.classLoader.getResourceAsStream("templates/base-mail.html")?.use {
            it.bufferedReader().readText()
        } ?: throw IllegalStateException("base-mail.html template not found in classpath")
    }

    @Cacheable(cacheNames = [CacheNames.TEMPLATE_BY_ID], key = "#id")
    override fun get(id: String): TemplateDto = toDto(templateRepository.findById(id).orElseThrow(
        {
            Exception("Template not found")
        }
    ))

    override fun getAll(pageable: Pageable): Page<TemplateDto> = templateRepository.findAll(pageable).map(::toDto)

    @CachePut(cacheNames = [CacheNames.TEMPLATE_BY_ID], key = "#result.id")
    override fun create(tmpl: TemplateRequestDto): TemplateDto {
        val boilerplate = getBoilerplateHtml()
        val mergedHtml = boilerplate.replace(
            "<div id=\"mail-content\"></div>",
            "<div id=\"mail-content\">${tmpl.htmlContent}</div>"
        )

        val fileName = "${System.currentTimeMillis()}-${tmpl.name.replace(" ", "_")}.html"
        val s3Key = "research/templates/$fileName"

        // Upload to S3
        val multipartFile = createMultipartFile(fileName, mergedHtml.toByteArray(), "text/html")
        s3Service.upload(bucketName, s3Key, multipartFile)

        val template = requestToEntity(tmpl).apply {
            bucketPath = s3Key
            // If variables not provided, try to auto-extract them from HTML
            if (tmpl.variables.isNullOrEmpty()) {
                variables = extractVariablesFromHtml(tmpl.htmlContent)?.let {
                    com.fasterxml.jackson.module.kotlin.jacksonObjectMapper().writeValueAsString(it)
                }
            }
        }
        return toDto(templateRepository.save(template))
    }

    @Caching(
        put = [CachePut(cacheNames = [CacheNames.TEMPLATE_BY_ID], key = "#id")],
        evict = [CacheEvict(cacheNames = [CacheNames.TEMPLATE_CONTENT], key = "#id")]
    )
    override fun update(id: String, tmpl: TemplateRequestDto): TemplateDto {
        val template = templateRepository.findById(id).orElseThrow(
            { Exception("Template not found") }
        )

        val boilerplate = getBoilerplateHtml()
        val mergedHtml = boilerplate.replace(
            "<div id=\"mail-content\"></div>",
            "<div id=\"mail-content\">${sanitize(tmpl.htmlContent)}</div>"
        )

        // Upload updated content to S3
        val fileName = template.bucketPath ?: "template.html"
        val multipartFile = createMultipartFile(fileName, mergedHtml.toByteArray(), "text/html")
        s3Service.upload(bucketName, template.bucketPath!!, multipartFile)

        template.name = tmpl.name
        template.description = tmpl.description ?: template.description
        template.updatedAt = LocalDateTime.now()
        return toDto(templateRepository.save(template))
    }

    @Caching(
        evict = [
            CacheEvict(cacheNames = [CacheNames.TEMPLATE_BY_ID], key = "#id"),
            CacheEvict(cacheNames = [CacheNames.TEMPLATE_CONTENT], key = "#id"),
        ]
    )
    override fun delete(id: String): Boolean {
        val template = templateRepository.findById(id).orElse(null) ?: return false

        // Delete from S3
        try {
            template.bucketPath?.let { s3Service.delete(bucketName, it) }
        } catch (e: Exception) {
            // Log error but continue with database deletion
            println("Error deleting from S3: ${e.message}")
        }

        templateRepository.deleteById(id)
        return true
    }

    override fun renderTemplate(id: String, variables: Map<String, Any>): String {
        val htmlContent = getTemplateContent(id)
            ?: throw Exception("Template not found or content unavailable")

        // Create Thymeleaf context with variables
        val context = Context()
        variables.forEach { (key, value) ->
            context.setVariable(key, value)
        }

        // Process the template with Thymeleaf
        return stringTemplateEngine.process(htmlContent, context)
    }

    @Cacheable(cacheNames = [CacheNames.TEMPLATE_CONTENT], key = "#id")
    override fun getTemplateContent(id: String): String? {
        val template = templateRepository.findById(id).orElse(null) ?: return null
        return template.bucketPath?.let {
            s3Service.download(bucketName, it)?.let { String(it) }
        }
    }

    private fun sanitize(html: String): String {
        val policy = HtmlPolicyBuilder()
            .allowStandardUrlProtocols()
//            .allowElements("img", "p", "a", "b", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "br", "span", "div")
            .allowAttributes("href").onElements("a")
            .allowAttributes("class").globally()
            .allowStyling()
            .toFactory()
        return policy.sanitize(html)
    }

    /**
     * Extract Thymeleaf variable names from HTML content
     * Finds patterns like ${variableName} and extracts "variableName"
     */
    private fun extractVariablesFromHtml(html: String): List<String>? {
        val variablePattern = """\$\{([^}]+)\}""".toRegex()
        val matches = variablePattern.findAll(html)
        val variables = matches.map { it.groupValues[1].trim() }
            .filter { it.isNotBlank() }
            .distinct()
            .toList()

        return if (variables.isEmpty()) null else variables
    }

    private fun createMultipartFile(fileName: String, content: ByteArray, contentType: String): MultipartFile {
        return object : MultipartFile {
            override fun getName(): String = "file"
            override fun getOriginalFilename(): String = fileName
            override fun getContentType(): String = contentType
            override fun isEmpty(): Boolean = content.isEmpty()
            override fun getSize(): Long = content.size.toLong()
            override fun getBytes(): ByteArray = content
            override fun getInputStream(): InputStream = ByteArrayInputStream(content)
            override fun transferTo(dest: File) {
                dest.writeBytes(content)
            }
        }
    }

    private fun toDto(template: com.example.researchreview.entities.Template): TemplateDto {
        return TemplateDto(
            id = template.id,
            name = template.name,
            description = template.description,
            bucketPath = template.bucketPath ?: "",
            createdAt = template.createdAt?.toString(),
            createdBy = template.createdBy,
            updatedAt = template.updatedAt?.toString(),
            updatedBy = template.updatedBy,
            variables = jsonToList(template.variables)
        )
    }

    private fun requestToEntity(dto: TemplateRequestDto): com.example.researchreview.entities.Template {
        return com.example.researchreview.entities.Template(
            name = dto.name,
            description = dto.description,
            bucketPath = "",
            variables = listToJson(dto.variables)
        )
    }

    private fun jsonToList(json: String?): List<String>? {
        if (json.isNullOrBlank()) return null
        return try {
            jacksonObjectMapper().readValue(json, List::class.java) as? List<String>
        } catch (e: Exception) {
            null
        }
    }

    private fun listToJson(list: List<String>?): String? {
        if (list.isNullOrEmpty()) return null
        return try {
            jacksonObjectMapper().writeValueAsString(list)
        } catch (e: Exception) {
            null
        }
    }
}