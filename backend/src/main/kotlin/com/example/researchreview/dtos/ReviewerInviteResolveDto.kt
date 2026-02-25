package com.example.researchreview.dtos

data class ReviewerInviteResolveDto(
    val email: String,
    val articleId: String,
    val articleTitle: String,
    val trackName: String,
    val authors: List<String>
)
