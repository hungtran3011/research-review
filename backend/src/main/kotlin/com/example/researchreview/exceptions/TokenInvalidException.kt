package com.example.researchreview.exceptions

class TokenInvalidException: Exception() {
    override val message: String
        get() = "Token is invalid"
}