package com.example.researchreview.dtos

import com.example.researchreview.constants.ConferenceMembershipRole
import java.time.LocalDateTime

data class ConferenceMembershipDto(
    val id: String,
    val userId: String,
    val userName: String,
    val userEmail: String,
    val conferenceId: String,
    val conferenceName: String,
    val membershipRole: ConferenceMembershipRole,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
