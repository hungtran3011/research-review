package com.example.researchreview.dtos

import java.time.LocalDateTime

data class AdminTrackConfigDto(
    val id: String,
    val conferenceId: String,
    val name: String,
    val description: String?,
    val isActive: Boolean,
    val reviewPolicyMinCompletedReviews: Int?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
