package com.example.researchreview.exceptions

class SendEmailFailedException: Exception() {
    override val message: String
        get() = "Failed to send email"
}