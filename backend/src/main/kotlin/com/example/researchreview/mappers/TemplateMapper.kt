package com.example.researchreview.mappers

import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import org.mapstruct.Mapper

@Mapper
interface TemplateMapper {
    fun toDto(template: Template): TemplateDto
    fun toEntity(templateDto: TemplateDto): Template
    fun requestToEntity(templateDto: TemplateRequestDto): Template
}