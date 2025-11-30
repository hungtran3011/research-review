package com.example.researchreview.services

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.dtos.EditorRequestDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface EditorService {
    fun getAll(pageable: Pageable): Page<EditorDto>
    fun getById(id: String): EditorDto
    fun create(request: EditorRequestDto): EditorDto
    fun update(id: String, request: EditorRequestDto): EditorDto
    fun delete(id: String)
}