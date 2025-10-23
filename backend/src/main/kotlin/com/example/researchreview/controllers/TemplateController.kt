package com.example.researchreview.controllers

import com.example.researchreview.constants.TemplateBusinessCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.services.TemplateService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/templates")
class TemplateController(
    private val templateService: TemplateService
) {
    @PostMapping("/")
    fun create(@Valid @RequestBody tmpl: TemplateRequestDto): ResponseEntity<BaseResponseDto<TemplateDto>> {
        val createdTemplate = try {
            templateService.create(tmpl)
        } catch (e: Exception) {
            val response = BaseResponseDto(
                code = TemplateBusinessCode.TEMPLATE_CREATED_FAIL.value,
                message = "Errors when creating template: ${e.message}",
                data = TemplateDto()
            )
            return ResponseEntity.status(422).body(response)
        }
        val response = BaseResponseDto(
            code = TemplateBusinessCode.TEMPLATE_CREATED_SUCCESSFULLY.value,
            message = "Template created successfully",
            data = createdTemplate
        )
        return ResponseEntity.status(201).body(response)
    }

    @GetMapping("/")
    fun getAll(pageable: Pageable): ResponseEntity<BaseResponseDto<PageResponseDto<TemplateDto>>> {
        val templates = templateService.getAll(pageable)
        val pageResponse = PageResponseDto.from(templates)
        val response = BaseResponseDto(
            code = TemplateBusinessCode.TEMPLATE_FOUND.value,
            message = "Templates retrieved successfully",
            data = pageResponse
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): TemplateDto? {
        return templateService.get(id)
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody tmpl: TemplateRequestDto): TemplateDto {
        return templateService.update(id, tmpl)
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: String): ResponseEntity<Map<String, Boolean>> {
        val deleted = templateService.delete(id)
        return ResponseEntity.ok(mapOf("success" to deleted))
    }
//
//    @PostMapping("/render")
//    fun renderTemplate(@RequestBody renderDto: TemplateRenderDto): ResponseEntity<Map<String, String>> {
//        val renderedHtml = templateService.renderTemplate(renderDto.templateId, renderDto.variables)
//        return ResponseEntity.ok(mapOf("renderedHtml" to renderedHtml))
//    }

    @GetMapping("/{id}/content")
    fun getTemplateContent(@PathVariable id: String): ResponseEntity<Map<String, String>> {
        val content = templateService.getTemplateContent(id)
        return if (content != null) {
            ResponseEntity.ok(mapOf("content" to content))
        } else {
            ResponseEntity.notFound().build()
        }
    }
}