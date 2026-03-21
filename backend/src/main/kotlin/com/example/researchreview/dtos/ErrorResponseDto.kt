package com.example.researchreview.dtos

import java.time.LocalDateTime

data class ErrorResponseDto(
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val status: Int,
    val errorCode: String,
    val message: String,
)
