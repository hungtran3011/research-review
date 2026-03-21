package com.example.researchreview.dtos

data class AuthResponseDto(
    val success: Boolean,
    val message: String,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val canResendAt: Long? = null,
    val attemptsRemaining: Int? = null
)

