package com.example.researchreview.services

import com.example.researchreview.dtos.ReviewerInviteDecisionDto

interface ReviewerInviteDecisionService {
    fun accept(token: String): ReviewerInviteDecisionDto
    fun decline(token: String): ReviewerInviteDecisionDto
}
