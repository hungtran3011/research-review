package com.example.researchreview.services

import com.example.researchreview.dtos.UserRequestDto

interface AuthService {
    fun signUpWithMail(email: String, deviceFingerprint: String? = null): MagicLinkSendResult
    fun signUpInfo(info: UserRequestDto)
    fun signInWithMail(email: String, deviceFingerprint: String? = null): MagicLinkSendResult
    fun sendMagicLink(email: String, isSignUp: Boolean, deviceFingerprint: String? = null): MagicLinkSendResult
    fun verifyMagicLink(email: String, token: String, isSignUp: Boolean, deviceFingerprint: String? = null): Tokens?
    fun signOut()
    fun refreshAccessToken(): Tokens
}

data class MagicLinkSendResult(
    val cooldownSeconds: Long,
    val attemptsRemaining: Int
)