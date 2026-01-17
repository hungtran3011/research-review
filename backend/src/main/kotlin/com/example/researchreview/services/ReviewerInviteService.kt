package com.example.researchreview.services

import com.example.researchreview.dtos.ReviewerInviteResolveDto

interface ReviewerInviteService {
    fun createInvite(email: String, articleId: String): String
    fun resolve(token: String): ReviewerInviteResolveDto
    fun consume(token: String): ReviewerInviteResolveDto
}
