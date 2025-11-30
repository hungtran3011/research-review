package com.example.researchreview.repositories

import com.example.researchreview.entities.ReviewerArticle
import org.springframework.data.jpa.repository.JpaRepository

interface ReviewerArticleRepository: JpaRepository<ReviewerArticle, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<ReviewerArticle>
    fun findByArticleIdAndReviewerId(articleId: String, reviewerId: String): ReviewerArticle?
}
