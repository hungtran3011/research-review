package com.example.researchreview.dtos

import com.example.researchreview.constants.ConferenceMembershipRole
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class ConferenceMembershipAssignRequestDto(
    @field:NotBlank(message = "userId is required")
    val userId: String,

    @field:NotNull(message = "membershipRole is required")
    val membershipRole: ConferenceMembershipRole,
)
