package com.example.researchreview.dtos

import com.example.researchreview.constants.ArticleStatus
import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class ArticleDto(
    var id: String = "",

    @field:NotBlank(message = "Title is required")
    var title: String = "",

    @field:NotBlank(message = "Abstract is required")
    var abstract: String = "",

    @field:NotBlank(message = "Conclusion is required")
    var conclusion: String = "",
    var link: String = "",
    var track: TrackDto = TrackDto(),
    var status: ArticleStatus = ArticleStatus.SUBMITTED,
    var initialReviewNote: String? = null,
    var initialReviewNextSteps: String? = null,
    var authors: List<AuthorDto> = emptyList(),
    var reviewers: List<ReviewerDto> = emptyList(),
    var createdAt: LocalDateTime? = null,
    var updatedAt: LocalDateTime? = null,
    var createdBy: String? = null,
    var updatedBy: String? = null
)