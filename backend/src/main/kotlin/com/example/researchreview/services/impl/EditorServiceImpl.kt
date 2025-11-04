package com.example.researchreview.services.impl

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.mappers.EditorMapper
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.EditorService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class EditorServiceImpl(
    private val editorRepository: EditorRepository,
    private val userRepository: UserRepository,
    private val editorMapper: EditorMapper
): EditorService {

    @Transactional
    override fun getAll(pageable: Pageable): Page<EditorDto> {
        val editors = editorRepository.getAll(pageable)
        return editors.map { editor -> editorMapper.toDto(editor) }
    }

    @Transactional
    override fun getById(id: String): EditorDto {
        val editor = editorRepository.findById(id).orElseThrow { Exception("Editor not found") }
        return editorMapper.toDto(editor)
    }

    @Transactional
    override fun create(editorDto: EditorDto): EditorDto {
        val editor = editorMapper.toEntity(editorDto)
        // Resolve user association if provided
        val userId = editorDto.user?.id ?: ""
        if (userId.isNotBlank()) {
            val user = userRepository.findById(userId).orElseThrow { Exception("User not found") }
            editor.user = user
        }
        val saved = editorRepository.save(editor)
        return editorMapper.toDto(saved)
    }

    @Transactional
    override fun update(editorDto: EditorDto): EditorDto {
        val id = editorDto.id
        val existing = editorRepository.findById(id).orElseThrow { Exception("Editor not found") }
        // Update user association if passed
        val userId = editorDto.user?.id ?: ""
        if (userId.isNotBlank()) {
            val user = userRepository.findById(userId).orElseThrow { Exception("User not found") }
            existing.user = user
        }
        val saved = editorRepository.save(existing)
        return editorMapper.toDto(saved)
    }

    @Transactional
    override fun delete(id: String) {
        editorRepository.deleteById(id)
    }
}