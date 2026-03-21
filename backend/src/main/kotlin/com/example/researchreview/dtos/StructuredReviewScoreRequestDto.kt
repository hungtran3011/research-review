package com.example.researchreview.dtos

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class StructuredReviewScoreRequestDto(
    @field:NotBlank(message = "criterion is required")
    val criterion: String,

    @field:Min(value = 1, message = "score must be >= 1")
    @field:Max(value = 10, message = "score must be <= 10")
    val score: Int,
)
