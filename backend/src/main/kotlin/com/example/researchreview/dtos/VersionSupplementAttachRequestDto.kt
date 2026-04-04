package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class VersionSupplementAttachRequestDto(
    @field:NotBlank
    val attachmentId: String
)
