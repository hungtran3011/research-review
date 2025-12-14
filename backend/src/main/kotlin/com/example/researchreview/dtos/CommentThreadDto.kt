package com.example.researchreview.dtos

import com.example.researchreview.constants.CommentStatus
import java.time.LocalDateTime

/**
 * Represents a group of comments that belong to the same annotation/selection.
 */
data class CommentThreadDto(
    val id: String = "",
    val articleId: String = "",
    val reviewerId: String? = null,
    val reviewerLabel: String? = null,
    val version: Int = 1,
    val pageNumber: Int = 1,
    val x: Int = 0,
    val y: Int = 0,
    val width: Int? = null,
    val height: Int? = null,
    val selectedText: String? = null,
    val section: String? = null,
    val status: CommentStatus = CommentStatus.OPEN,
    val comments: List<CommentDto> = emptyList(),
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null
)
