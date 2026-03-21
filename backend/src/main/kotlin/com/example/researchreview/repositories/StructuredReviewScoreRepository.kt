package com.example.researchreview.repositories

import com.example.researchreview.entities.StructuredReviewScore
import org.springframework.data.jpa.repository.JpaRepository

interface StructuredReviewScoreRepository : JpaRepository<StructuredReviewScore, String> {
    fun findAllByStructuredReviewIdAndDeletedFalse(structuredReviewId: String): List<StructuredReviewScore>
}
