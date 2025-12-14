package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class UserRoleUpdateRequestDto(
    @field:NotBlank(message = "Role is required")
    val role: String
)
