package com.example.researchreview.mappers

import com.example.researchreview.dtos.TemplateDto
import com.example.researchreview.dtos.TemplateRequestDto
import com.example.researchreview.entities.Template
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings
import org.mapstruct.Named
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

@Mapper(componentModel = "spring")
interface TemplateMapper {
    @Mapping(target = "variables", source = "variables", qualifiedByName = ["jsonToList"])
    fun toDto(template: Template): TemplateDto

    @Mapping(target = "variables", source = "variables", qualifiedByName = ["listToJson"])
    fun requestToEntity(templateDto: TemplateRequestDto): Template

    companion object {
        private val objectMapper = jacksonObjectMapper()

        @JvmStatic
        @Named("jsonToList")
        fun jsonToList(json: String?): List<String>? {
            if (json.isNullOrBlank()) return null
            return try {
                objectMapper.readValue(json, List::class.java) as? List<String>
            } catch (e: Exception) {
                null
            }
        }

        @JvmStatic
        @Named("listToJson")
        fun listToJson(list: List<String>?): String? {
            if (list.isNullOrEmpty()) return null
            return try {
                objectMapper.writeValueAsString(list)
            } catch (e: Exception) {
                null
            }
        }
    }
}