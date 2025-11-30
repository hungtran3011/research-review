package com.example.researchreview.dtos

import java.time.LocalDateTime

data class AuthorDto(
    var id: String = "",
    var name: String = "",
    var email: String = "",
    var institution: InstitutionDto = InstitutionDto(),
    var user: UserDto? = null,
    var createdAt: LocalDateTime? = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = LocalDateTime.now(),
    var createdBy: String? = null,
    var updatedBy: String? = null
)