package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class AuthRequestDto(
    @field:Email(message = "Invalid email format")
    @field:NotBlank(message = "Email is required")
    val email: String,
    val isSignUp: Boolean?
)

