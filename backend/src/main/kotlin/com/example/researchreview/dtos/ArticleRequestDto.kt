package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty

data class ArticleRequestDto (
    var id: String? = null,
    @field:NotBlank(message = "Title is required")
    var title: String = "",

    @field:NotBlank(message = "Abstract is required")
    var abstract: String = "",

    @field:NotBlank(message = "Conclusion is required")
    var conclusion: String = "",

    var link: String = "",

    @field:NotBlank(message = "Conference is required")
    var conferenceId: String = "",

    @field:NotBlank(message = "Track is required")
    var trackId: String = "",

    @field:NotEmpty(message = "At least one topic is required")
    var topicIds: List<String> = emptyList(),

    var trackName: String? = null, // can be used for searching
    var authors: List<AuthorDto> = emptyList()
)