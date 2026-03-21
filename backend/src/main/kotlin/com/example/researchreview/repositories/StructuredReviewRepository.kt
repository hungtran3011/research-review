package com.example.researchreview.repositories

import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.entities.StructuredReview
import org.springframework.data.jpa.repository.JpaRepository

interface StructuredReviewRepository : JpaRepository<StructuredReview, String> {
    fun findByReviewerArticleIdAndDeletedFalse(reviewerArticleId: String): StructuredReview?
    fun findAllByReviewerArticleArticleIdAndDeletedFalse(articleId: String): List<StructuredReview>
    fun findAllByReviewerArticleArticleIdAndSubmittedAtIsNotNullAndDeletedFalse(articleId: String): List<StructuredReview>
    fun countByReviewerArticleArticleIdAndSubmittedAtIsNotNullAndDeletedFalse(articleId: String): Long
    fun countByReviewerArticleArticleIdAndReviewerArticleStatusAndSubmittedAtIsNotNullAndDeletedFalse(
        articleId: String,
        reviewerStatus: ReviewerInvitationStatus,
    ): Long
}
