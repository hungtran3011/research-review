package com.example.researchreview.dtos

import com.example.researchreview.constants.ConferenceStatus
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import java.time.LocalDateTime

data class ConferenceConfigSettingsPatchRequestDto(
    val status: ConferenceStatus? = null,
    val submissionDeadline: LocalDateTime? = null,

    @field:Min(value = 1, message = "minimumCompletedReviews must be >= 1")
    @field:Max(value = 20, message = "minimumCompletedReviews must be <= 20")
    val minimumCompletedReviews: Int? = null,
)
