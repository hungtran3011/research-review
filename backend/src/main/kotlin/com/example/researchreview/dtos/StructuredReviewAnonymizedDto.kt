package com.example.researchreview.dtos

import java.time.LocalDateTime

data class StructuredReviewAnonymizedDto(
    val id: String,
    val articleId: String,
    val reviewerLabel: String,
    val scores: List<StructuredReviewScoreDto>,
    val summaryNotes: String,
    val submittedAt: LocalDateTime?,
)
