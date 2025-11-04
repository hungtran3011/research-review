package com.example.researchreview.services

interface EmailService {
    fun sendEmail(
        to: List<String>,
        cc: List<String>? = null,
        bcc: List<String>? = null,
        subject: String,
        message: String,
        template: String,
        attachment: Map<String, ByteArray>? = null
    )
}