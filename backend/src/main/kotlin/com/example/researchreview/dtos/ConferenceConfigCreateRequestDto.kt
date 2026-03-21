package com.example.researchreview.dtos

import com.example.researchreview.constants.ConferenceStatus
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

data class ConferenceConfigCreateRequestDto(
    @field:NotBlank(message = "name is required")
    val name: String,

    @field:NotBlank(message = "shortName is required")
    val shortName: String,

    val season: String? = null,

    @field:Min(value = 1900, message = "year must be >= 1900")
    @field:Max(value = 9999, message = "year must be <= 9999")
    val year: Int? = null,

    val description: String? = null,

    @field:NotNull(message = "status is required")
    val status: ConferenceStatus,

    val submissionDeadline: LocalDateTime? = null,

    @field:Min(value = 1, message = "minimumCompletedReviews must be >= 1")
    @field:Max(value = 20, message = "minimumCompletedReviews must be <= 20")
    val minimumCompletedReviews: Int = 3,
)
