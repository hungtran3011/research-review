package com.example.researchreview.exceptions

class UserNotFoundException: Exception() {
    override val message: String
        get() = "User not found"
}