package com.example.researchreview.dtos

import com.example.researchreview.constants.InitialReviewDecision
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

/**
 * Capture the decision taken by an editor during initial review.
 */
data class InitialReviewRequestDto(
    @field:NotNull(message = "Decision is required")
    val decision: InitialReviewDecision,

    @field:NotBlank(message = "Reviewer note is required")
    val note: String,
    val nextSteps: String? = null
)
