package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class VerifyTokenRequestDto(
    @field:Email(message = "{validation.email.invalid}")
    @field:NotBlank(message = "{validation.email.required}")
    val email: String,

    @field:NotBlank(message = "{validation.token.required}")
    val token: String,

    val isSignUp: Boolean = true,
    @field:Size(max = 512, message = "{validation.deviceFingerprint.tooLong}")
    val deviceFingerprint: String? = null
)
