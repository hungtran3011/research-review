package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class ArticleRequestDto (
    @field:NotBlank(message = "Title is required")
    var title: String,

    @field:NotBlank(message = "Abstract is required")
    var abstract: String,

    @field:NotBlank(message = "Conclusion is required")
    var conclusion: String,
    var link: String,
    var trackId: String,
    var trackName: String?, // can be used for searching
    var authors: List<AuthorDto>
)