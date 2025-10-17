package com.example.researchreview.services

import com.example.researchreview.dtos.InstitutionDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface InstitutionService {
    fun getAll(pageable: Pageable): Page<InstitutionDto>
    fun getById(id: String): InstitutionDto
    fun create(institutionDto: InstitutionDto): InstitutionDto
    fun update(id: String, institutionDto: InstitutionDto): InstitutionDto
    fun delete(id: String)
}