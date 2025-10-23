package com.example.researchreview.services

import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.UUID

interface TemplateService {
    fun get(id: String): TemplateDto?
    fun getAll(pageable: Pageable): Page<TemplateDto>
    fun create(tmpl: TemplateRequestDto): TemplateDto
    fun update(id: String, tmpl: TemplateRequestDto): TemplateDto
    fun delete(id: String): Boolean
    fun renderTemplate(templateId: String, variables: Map<String, Any>): String
    fun getTemplateContent(templateId: String): String?
}