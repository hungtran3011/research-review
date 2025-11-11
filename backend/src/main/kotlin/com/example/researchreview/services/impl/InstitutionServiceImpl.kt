package com.example.researchreview.services.impl

import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.entities.Institution
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.services.InstitutionService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class InstitutionServiceImpl(
    private val institutionRepository: InstitutionRepository
): InstitutionService {

    @Transactional
    override fun getAll(pageable: Pageable): Page<InstitutionDto> {
        val institutions = institutionRepository.findAll(pageable)
        return institutions.map { toDto(it) }
    }

    @Transactional
    override fun getById(id: String): InstitutionDto {
        val institution = institutionRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Institution not found with id: $id") }
        return toDto(institution)
    }

    @Transactional
    override fun create(institutionDto: InstitutionDto): InstitutionDto {
        val institution = toEntity(institutionDto)
        val savedInstitution = institutionRepository.save(institution)
        return toDto(savedInstitution)
    }

    @Transactional
    override fun update(id: String, institutionDto: InstitutionDto): InstitutionDto {
        val institution = institutionRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Institution not found with id: $id") }
        
        institution.name = institutionDto.name
        institution.country = institutionDto.country
        institution.website = institutionDto.website
        institution.logo = institutionDto.logo
        
        val savedInstitution = institutionRepository.save(institution)
        return toDto(savedInstitution)
    }

    @Transactional
    override fun delete(id: String) {
        val institution = institutionRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Institution not found with id: $id") }
        institutionRepository.deleteById(id)
    }

    private fun toDto(institution: Institution): InstitutionDto {
        return InstitutionDto(
            id = institution.id.toString(),
            name = institution.name,
            country = institution.country,
            website = institution.website,
            logo = institution.logo
        )
    }

    private fun toEntity(dto: InstitutionDto): Institution {
        return Institution(
            name = dto.name,
            country = dto.country,
            website = dto.website,
            logo = dto.logo
        )
    }
}
