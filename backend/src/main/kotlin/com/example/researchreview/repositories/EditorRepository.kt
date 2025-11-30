package com.example.researchreview.repositories

import com.example.researchreview.entities.Editor
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface EditorRepository : JpaRepository<Editor, String> {
    fun findAllByDeletedFalse(pageable: Pageable): Page<Editor>

    fun findByIdAndDeletedFalse(id: String): java.util.Optional<Editor>

    override fun deleteById(id: String) {
        val editor = findById(id).orElseThrow { Exception("Editor not found") }
        editor.deleted = true
        save(editor)
    }
}

