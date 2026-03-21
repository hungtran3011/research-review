package com.example.researchreview.dtos

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class AdminTopicConfigUpdateRequestDto(
    @field:NotBlank(message = "name is required")
    val name: String,

    val description: String? = null,
    val isActive: Boolean,

    @field:Min(value = 0, message = "orderIndex must be >= 0")
    val orderIndex: Int,

    val trackId: String? = null,
)
