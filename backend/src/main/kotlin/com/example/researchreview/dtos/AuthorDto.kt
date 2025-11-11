package com.example.researchreview.dtos

import java.time.LocalDateTime

data class AuthorDto(
    var id: String,
    var name: String,
    var email: String,
    var institution: InstitutionDto,
    var user: UserDto?,
    var createdAt: LocalDateTime? = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = LocalDateTime.now(),
    var createdBy: String?,
    var updatedBy: String?
)