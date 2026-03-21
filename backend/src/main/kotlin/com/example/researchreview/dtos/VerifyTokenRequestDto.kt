package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class VerifyTokenRequestDto(
    @field:Email(message = "Invalid email format")
    @field:NotBlank(message = "Email is required")
    val email: String,

    @field:NotBlank(message = "Token is required")
    val token: String,

    val isSignUp: Boolean = true,
    @field:Size(max = 512, message = "Device fingerprint is too long")
    val deviceFingerprint: String? = null
)
