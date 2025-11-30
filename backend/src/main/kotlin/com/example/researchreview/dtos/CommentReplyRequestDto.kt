package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

/**
 * Request payload for adding a reply to an existing thread.
 */
data class CommentReplyRequestDto(
    @field:NotBlank(message = "Content is required")
    val content: String,

    @field:NotBlank(message = "Author name is required")
    val authorName: String,
    val authorId: String? = null
)
