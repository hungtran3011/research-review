package com.example.researchreview.dtos

import com.example.researchreview.constants.ReviewRecommendation
import java.time.LocalDateTime

data class StructuredReviewDto(
    val id: String,
    val articleId: String,
    val reviewerId: String,
    val reviewerName: String,
    val reviewerEmail: String,
    val reviewerDisplayIndex: Int,
    val scores: List<StructuredReviewScoreDto>,
    val summaryNotes: String,
    val confidentialRemarks: String?,
    val recommendation: ReviewRecommendation,
    val submittedAt: LocalDateTime?,
)
