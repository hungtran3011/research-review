package com.example.researchreview.dtos

import com.example.researchreview.constants.ConferenceStatus
import java.time.LocalDateTime

data class ConferenceConfigDto(
    val id: String,
    val name: String,
    val shortName: String,
    val season: String?,
    val year: Int?,
    val description: String?,
    val status: ConferenceStatus,
    val submissionDeadline: LocalDateTime?,
    val minimumCompletedReviews: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
