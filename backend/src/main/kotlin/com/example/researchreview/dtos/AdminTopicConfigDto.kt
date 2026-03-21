package com.example.researchreview.dtos

import java.time.LocalDateTime

data class AdminTopicConfigDto(
    val id: String,
    val conferenceId: String,
    val trackId: String?,
    val name: String,
    val description: String?,
    val isActive: Boolean,
    val orderIndex: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
