package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

/**
 * Admin-only DTO for creating users (including ADMIN/EDITOR) without requiring full profile completion.
 */
data class AdminCreateUserRequestDto(
    @field:NotBlank(message = "Name is required")
    var name: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email")
    var email: String,

    @field:NotBlank(message = "Role is required")
    var role: String,

    var institutionId: String? = null,
    var trackId: String? = null,

    var avatarId: String? = null
)
