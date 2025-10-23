package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class ArticleDto(
    var id: String,

    @field:NotBlank(message = "Title is required")
    var title: String,

    @field:NotBlank(message = "Abstract is required")
    var abstract: String,

    @field:NotBlank(message = "Conclusion is required")
    var conclusion: String,
    var link: String,
    var track: TrackDto,

    @field:NotBlank(message = "Status is required")
    var authors: List<AuthorDto>,
    var reviewers: List<ReviewerDto>,
    var createdAt: LocalDateTime,
    var updatedAt: LocalDateTime,
    var createdBy: String,
    var updatedBy: String
)