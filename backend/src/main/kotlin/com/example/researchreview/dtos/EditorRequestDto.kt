package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class EditorRequestDto(
    @field:NotBlank(message = "trackId is required")
    var trackId: String = "",

    @field:NotBlank(message = "userId is required")
    var userId: String = ""
)