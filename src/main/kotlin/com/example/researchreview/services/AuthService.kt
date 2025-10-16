package com.example.researchreview.services

interface AuthService {
    fun signUpWithMail(email: String)
    fun signInWithMail(email: String)
    fun sendMagicLink(email: String)
    fun verifyMagicLink(token: String)
    fun signOut()
}