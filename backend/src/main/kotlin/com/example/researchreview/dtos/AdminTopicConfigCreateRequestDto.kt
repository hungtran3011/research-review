package com.example.researchreview.dtos

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class AdminTopicConfigCreateRequestDto(
    @field:NotBlank(message = "name is required")
    val name: String,

    val description: String? = null,
    val isActive: Boolean = true,

    @field:Min(value = 0, message = "orderIndex must be >= 0")
    val orderIndex: Int = 0,

    val trackId: String? = null,
)
