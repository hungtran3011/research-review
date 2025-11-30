package com.example.researchreview.dtos

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

/**
 * Request payload to open a comment thread on an article.
 */
data class CommentCreateRequestDto(
    @field:NotBlank(message = "Content is required")
    val content: String,

    @field:NotBlank(message = "Author name is required")
    val authorName: String,
    val authorId: String? = null,

    @field:NotNull(message = "Version is required")
    val version: Int,

    @field:NotNull(message = "Page number is required")
    @field:Min(1)
    @field:Max(10_000)
    val pageNumber: Int,
    val x: Int = 0,
    val y: Int = 0,
    val width: Int? = null,
    val height: Int? = null,
    val selectedText: String? = null,
    val section: String? = null
)
