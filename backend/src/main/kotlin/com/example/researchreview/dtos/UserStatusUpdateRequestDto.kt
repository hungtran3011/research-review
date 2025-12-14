package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class UserStatusUpdateRequestDto(
    @field:NotBlank(message = "Status is required")
    val status: String
)
