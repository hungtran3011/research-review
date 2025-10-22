package com.example.researchreview.services.impl

import com.example.researchreview.services.AuthService
import com.example.researchreview.services.EmailService
import org.springframework.stereotype.Service

@Service
class AuthServiceImpl: AuthService {
    override fun signUpWithMail(email: String) {
        TODO("Not yet implemented")
    }

    override fun signInWithMail(email: String) {
        TODO("Not yet implemented")
    }

    override fun sendMagicLink(email: String) {
        TODO("Not yet implemented")
    }

    override fun verifyMagicLink(token: String) {
        TODO("Not yet implemented")
    }

    override fun signOut() {
        TODO("Not yet implemented")
    }
}