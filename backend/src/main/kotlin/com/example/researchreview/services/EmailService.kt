package com.example.researchreview.services

interface EmailService {
    fun sendEmail(
        to: List<String>,
        subject: String,
        message: String,
        template: String,
        attachment: Map<String, ByteArray>? = null
    )
}