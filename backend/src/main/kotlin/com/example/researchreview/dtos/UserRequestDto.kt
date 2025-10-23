package com.example.researchreview.dtos

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class UserRequestDto(
    @field:NotBlank(message = "Name is required")
    var name: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email")
    var email: String,

    @field:NotBlank(message = "Role is required")
    var role: String,

    var avatarId: String,
    var institutionId: String,
    var institutionName: String?, // can be used for searching
)
