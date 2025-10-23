package com.example.researchreview.exceptions

class VerifiedEmailException: Exception() {
    override val message: String
        get() = "Email is already verified"
}