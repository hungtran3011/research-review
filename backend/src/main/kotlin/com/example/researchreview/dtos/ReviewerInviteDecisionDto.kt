package com.example.researchreview.dtos

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.ReviewerInvitationStatus

data class ReviewerInviteDecisionDto(
    val articleId: String,
    val articleStatus: ArticleStatus,
    val reviewerStatus: ReviewerInvitationStatus
)
