package com.example.researchreview.services

import com.example.researchreview.dtos.UserRequestDto

interface AuthService {
    fun signUpWithMail(email: String)
    fun signUpInfo(info: UserRequestDto)
    fun signInWithMail(email: String)
    fun sendMagicLink(email: String, isSignUp: Boolean)
    fun verifyMagicLink(email: String, token: String, isSignUp: Boolean): Tokens?
    fun signOut()
    fun refreshAccessToken(): Tokens
}