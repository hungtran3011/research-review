package com.example.researchreview.dtos

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class AdminTrackConfigUpdateRequestDto(
    @field:NotBlank(message = "name is required")
    val name: String,

    val description: String? = null,
    val isActive: Boolean,

    @field:Min(value = 1, message = "reviewPolicyMinCompletedReviews must be >= 1")
    @field:Max(value = 20, message = "reviewPolicyMinCompletedReviews must be <= 20")
    val reviewPolicyMinCompletedReviews: Int? = null,
)
