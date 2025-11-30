package com.example.researchreview.dtos

import com.example.researchreview.constants.CommentStatus
import jakarta.validation.constraints.NotNull

/**
 * Payload for updating the status of a comment thread.
 */
data class CommentStatusUpdateRequestDto(
    @field:NotNull(message = "Status is required")
    val status: CommentStatus
)
