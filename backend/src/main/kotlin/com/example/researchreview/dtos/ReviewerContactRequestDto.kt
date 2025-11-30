package com.example.researchreview.dtos

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Request payload for contacting reviewers about a specific article.
 */
data class ReviewerContactRequestDto(
    @field:NotBlank(message = "Subject is required")
    val subject: String,

    @field:NotBlank(message = "Message is required")
    val message: String,

    @field:Size(max = 20, message = "Cannot contact more than 20 reviewers at a time")
    val reviewerIds: List<String> = emptyList(),

    @field:Valid
    val newReviewers: List<ReviewerRequestDto> = emptyList()
)
