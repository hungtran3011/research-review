package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import java.time.LocalDateTime

data class ReviewerDto(
    var id: String,
    var name: String,

    @field:Email(message = "Invalid email")
    var email: String,

    var institution: InstitutionDto,
    var user: UserDto?,
    var createdAt: LocalDateTime?,
    var updatedAt: LocalDateTime?,
    var createdBy: String?,
    var updatedBy: String?
)