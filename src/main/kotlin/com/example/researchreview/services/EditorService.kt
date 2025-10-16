package com.example.researchreview.services

import com.example.researchreview.dtos.EditorDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface EditorService {
    fun getAll(pageable: Pageable): Page<EditorDto>
    fun getById(id: String): EditorDto
    fun create(editorDto: EditorDto): EditorDto
    fun update(editorDto: EditorDto): EditorDto
    fun delete(id: String)
}