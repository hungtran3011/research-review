package com.example.researchreview.repositories

import com.example.researchreview.entities.Reviewer
import org.springframework.data.jpa.repository.JpaRepository

interface ReviewerRepository: JpaRepository<Reviewer, String> {
    fun findByEmail(email: String): Reviewer?
    fun findByUserId(id: String): Reviewer?
}
