package com.example.researchreview.dtos

import java.time.LocalDateTime

data class ArticleDto(
    var id: String,
    var title: String,
    var abstract: String,
    var conclusion: String,
    var link: String,
    var track: TrackDto,
    var authors: List<AuthorDto>,
    var reviewers: List<ReviewerDto>,
    var createdAt: LocalDateTime,
    var updatedAt: LocalDateTime,
    var createdBy: String,
    var updatedBy: String
)