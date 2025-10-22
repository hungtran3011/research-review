package com.example.researchreview.services

import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import java.util.UUID

interface TemplateService {
    fun get(id: String): TemplateDto?
    fun getAll(): List<TemplateDto>
    fun create(tmpl: TemplateRequestDto): TemplateDto
    fun update(id: String, tmpl: TemplateRequestDto): TemplateDto
    fun delete(id: String): Boolean
}