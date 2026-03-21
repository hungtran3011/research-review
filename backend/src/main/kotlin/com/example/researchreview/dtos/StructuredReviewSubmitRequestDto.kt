package com.example.researchreview.dtos

import com.example.researchreview.constants.ReviewRecommendation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull

data class StructuredReviewSubmitRequestDto(
    @field:NotEmpty(message = "scores are required")
    @field:Valid
    val scores: List<StructuredReviewScoreRequestDto>,

    @field:NotBlank(message = "summaryNotes is required")
    val summaryNotes: String,

    val confidentialRemarks: String? = null,

    @field:NotNull(message = "recommendation is required")
    val recommendation: ReviewRecommendation,

    val finalSubmit: Boolean = true,
)
