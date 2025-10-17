package com.example.researchreview.dtos

data class ArticleRequestDto (
    var title: String,
    var abstract: String,
    var conclusion: String,
    var link: String,
    var trackId: String,
    var authors: List<AuthorDto>
)