package com.example.researchreview.repositories

import com.example.researchreview.entities.Author
import org.springframework.data.jpa.repository.JpaRepository

interface AuthorRepository: JpaRepository<Author, String> {
    fun findByEmail(email: String): Author?
}
