package com.example.researchreview.dtos

import jakarta.validation.constraints.Email

data class ReviewerDto(
    var id: String,
    var name: String,

    @field:Email(message = "Invalid email")
    var email: String,

    var institution: InstitutionDto,
    var user: UserDto?
)