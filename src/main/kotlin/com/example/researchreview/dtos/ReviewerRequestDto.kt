package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class ReviewerRequestDto(
    var name: String,

    @field:Email(message = "Invalid email")
    var email: String,

    var institutionId: String,
    var userId: String? = null,

    @field:NotBlank(message = "Article Id is required")
    var articleId: String,
)