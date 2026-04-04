package com.example.researchreview.dtos

import java.time.LocalDateTime

data class ArticleVersionDto(
    val id: String,
    val articleId: String,
    val versionNumber: Int,
    val submittedAt: LocalDateTime?,
    val submittedBy: String?,
    val mainAttachment: VersionSupplementDto?,
    val supplements: List<VersionSupplementDto>
)
