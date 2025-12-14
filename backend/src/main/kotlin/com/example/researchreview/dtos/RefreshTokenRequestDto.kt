package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class RefreshTokenRequestDto(
    @field:NotBlank
    val refreshToken: String
)
