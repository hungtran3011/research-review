package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class AuthRequestDto(
    @field:Email(message = "Invalid email format")
    @field:NotBlank(message = "Email is required")
    val email: String,
    val isSignUp: Boolean?,
    @field:Size(max = 512, message = "Device fingerprint is too long")
    val deviceFingerprint: String? = null
)

