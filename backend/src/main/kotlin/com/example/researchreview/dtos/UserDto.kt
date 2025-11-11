package com.example.researchreview.dtos

import com.example.researchreview.constants.AcademicStatus
import com.example.researchreview.constants.Gender
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class UserDto(
    var id: String = "",

    @field:NotBlank(message = "Name is required")
    var name: String = "",

    @field:NotBlank(message = "Role is required")
    var role: String = "",

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email")
    var email: String = "",

    var avatarId: String = "",
    var institution: InstitutionDto = InstitutionDto(),
    var track: TrackDto = TrackDto(),
    var gender: Gender = Gender.OTHER,
    var nationality: String = "",
    var academicStatus: AcademicStatus = AcademicStatus.TS,
    var createdAt: LocalDateTime? = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = LocalDateTime.now(),
    var createdBy: String? = "",
    var updatedBy: String? = "",
)
