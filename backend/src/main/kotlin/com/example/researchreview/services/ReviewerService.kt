package com.example.researchreview.services

import com.example.researchreview.dtos.ReviewerDto

interface ReviewerService {
    fun contactReviewer(reviewer: ReviewerDto, articleId: String)
    fun revokeInvitation(reviewer: ReviewerDto)
}