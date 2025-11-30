package com.example.researchreview.services

import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto

interface ReviewerService {
    fun contactReviewers(articleId: String, request: ReviewerContactRequestDto): List<ReviewerDto>
    fun revokeInvitation(articleId: String, reviewerId: String)
}