package com.example.researchreview.dtos

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

data class ArticleVersionCreateRequestDto(
    @field:NotNull
    @field:Min(1)
    val versionNumber: Int,
    val mainAttachmentId: String? = null
)
