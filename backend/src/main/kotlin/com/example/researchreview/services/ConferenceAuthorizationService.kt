package com.example.researchreview.services

interface ConferenceAuthorizationService {
    fun canSubmit(conferenceId: String, userId: String? = null): Boolean
    fun canManageReview(articleId: String, userId: String? = null): Boolean
    fun canFinalizeDecision(articleId: String, userId: String? = null): Boolean
    fun canSubmitStructuredReview(articleId: String, userId: String? = null): Boolean

    fun requireCanSubmit(conferenceId: String, endpoint: String, userId: String? = null)
    fun requireCanManageReview(articleId: String, endpoint: String, userId: String? = null)
    fun requireCanFinalizeDecision(articleId: String, endpoint: String, userId: String? = null)
    fun requireCanSubmitStructuredReview(articleId: String, endpoint: String, userId: String? = null)
}
