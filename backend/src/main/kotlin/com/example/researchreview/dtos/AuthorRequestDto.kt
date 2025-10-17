package com.example.researchreview.dtos

data class AuthorRequestDto(
    var id: String,
    var name: String,
    var email: String,
    var institutionId: String,
    var userId: String
)