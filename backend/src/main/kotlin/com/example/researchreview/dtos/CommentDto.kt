package com.example.researchreview.dtos

import java.time.LocalDateTime

/**
 * Represents a single comment entry within a thread.
 */
data class CommentDto(
    val id: String = "",
    val content: String = "",
    val authorName: String = "",
    val authorId: String? = null,
    val createdAt: LocalDateTime? = null,
    val createdBy: String? = null
)
