package com.example.researchreview.services.impl

import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import com.example.researchreview.mappers.TemplateMapper
import com.example.researchreview.repositories.TemplateRepository
import com.example.researchreview.services.TemplateService
import org.owasp.html.HtmlPolicyBuilder
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.util.UUID

@Service
class TemplateServiceImpl @Autowired constructor(
    private val templateRepository: TemplateRepository,
    private val mapper: TemplateMapper
) : TemplateService {
    private val bucketDir = "bucket/templates" // Local bucket placeholder
    private val boilerplatePath = "src/main/resources/templates/base-mail.html"

    override fun get(id: String): TemplateDto = mapper.toDto(templateRepository.findById(id).orElseThrow(
        {
            Exception("Template not found")
        }
    ))

    override fun getAll(): List<TemplateDto> = templateRepository.findAll().map(mapper::toDto)

    override fun create(tmpl: TemplateRequestDto): TemplateDto {
        val boilerplate = File(boilerplatePath).readText()
        val mergedHtml = boilerplate.replace(
            "<div id=\"mail-content\"></div>",
            "<div id=\"mail-content\">${sanitize(tmpl.htmlContent)}</div>"
        )
        val fileName = "${System.currentTimeMillis()}-${tmpl.name}.html"
        val filePath = "$bucketDir/$fileName"
        File(bucketDir).mkdirs()
        File(filePath).writeText(mergedHtml)
        val template = mapper.requestToEntity(tmpl).apply {
            bucketPath = filePath
        }
        return mapper.toDto(templateRepository.save(template))
    }

    override fun update(id: String, tmpl: TemplateRequestDto): TemplateDto {
        val template = templateRepository.findById(id).orElseThrow(
            { Exception("Template not found") }
        )
        val boilerplate = File(boilerplatePath).readText()
        val mergedHtml = boilerplate.replace("<div id=\"mail-content\"></div>", "<div id=\"mail-content\">${tmpl.htmlContent}</div>")
        File(template.bucketPath).writeText(mergedHtml)
        template.name = tmpl.name
        template.description = tmpl.description ?: template.description
        template.updatedAt = LocalDateTime.now()
        return mapper.toDto(templateRepository.save(template))
    }

    override fun delete(id: String): Boolean {
        val template = templateRepository.findById(id).orElse(null) ?: return false
        Files.deleteIfExists(Paths.get(template.bucketPath))
        templateRepository.deleteById(id)
        return true
    }

    private fun sanitize(html: String): String {
        val policy = HtmlPolicyBuilder()
            .allowStandardUrlProtocols()
            .allowAttributes("href").onElements("a")
            .allowAttributes("class").globally()
            .allowStyling()
            .toFactory()
        return policy.sanitize(html)
    }
}