package com.example.researchreview.repositories

import com.example.researchreview.entities.Editor
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface EditorRepository: JpaRepository<Editor, String> {
    @Query("SELECT e FROM Editor e WHERE e.deleted = false")
    fun getAll(pageable: Pageable): Page<Editor>

    override fun deleteById(id: String) {
        val editor = findById(id).orElseThrow { Exception("Editor not found") }
        editor.deleted = true
        save(editor)
    }
}

