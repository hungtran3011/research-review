package com.example.researchreview.controllers

import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import com.example.researchreview.services.TemplateService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/templates")
class TemplateController(
    private val templateService: TemplateService
) {
    @PostMapping("/")
    fun create(tmpl: TemplateRequestDto): Template {
        return templateService.create(tmpl)
    }
}