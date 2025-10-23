package com.example.researchreview.services

interface AuthService {
    fun signUpWithMail(email: String)
    fun signInWithMail(email: String)
    fun sendMagicLink(email: String)
    fun verifyMagicLink(email: String, token: String, isSignUp: Boolean): Boolean
    fun signOut()
}