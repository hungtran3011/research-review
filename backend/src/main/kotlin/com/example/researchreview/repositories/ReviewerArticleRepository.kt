package com.example.researchreview.repositories

import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.entities.ReviewerArticle
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

interface ReviewerArticleRepository: JpaRepository<ReviewerArticle, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<ReviewerArticle>
    fun findAllByReviewerIdAndDeletedFalse(reviewerId: String): List<ReviewerArticle>

    @Query("SELECT ra FROM ReviewerArticle ra WHERE ra.article.id = :articleId AND ra.deleted = false")
    fun findByArticleIdAndReviewerId(articleId: String, reviewerId: String): ReviewerArticle?

    fun findAllByArticleIdAndStatusAndDeletedFalse(articleId: String, status: ReviewerInvitationStatus): List<ReviewerArticle>

    @Query(
        "SELECT ra FROM ReviewerArticle ra " +
            "JOIN Reviewer r ON ra.reviewer = r " +
            "LEFT JOIN User u ON r.user = u " +
            "WHERE ra.deleted = false AND ra.article.id = :articleId " +
            "AND (u.id = :userId OR LOWER(r.email) = LOWER(:email))"
    )
    fun findByArticleIdAndReviewerUserIdOrEmail(
        @Param("articleId") articleId: String,
        @Param("userId") userId: String,
        @Param("email") email: String,
    ): Optional<ReviewerArticle>
}
