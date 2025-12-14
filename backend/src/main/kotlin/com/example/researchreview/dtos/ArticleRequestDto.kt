package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class ArticleRequestDto (
    var id: String? = null,
    @field:NotBlank(message = "Title is required")
    var title: String = "",

    @field:NotBlank(message = "Abstract is required")
    var abstract: String = "",

    @field:NotBlank(message = "Conclusion is required")
    var conclusion: String = "",

    var link: String = "",

    @field:NotBlank(message = "Track is required")
    var trackId: String = "",
    var trackName: String? = null, // can be used for searching
    var authors: List<AuthorDto> = emptyList()
)