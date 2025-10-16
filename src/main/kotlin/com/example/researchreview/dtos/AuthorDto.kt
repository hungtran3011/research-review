package com.example.researchreview.dtos

data class AuthorDto(
    var id: String,
    var name: String,
    var email: String,
    var institution: InstitutionDto,
    var user: UserDto?,
)