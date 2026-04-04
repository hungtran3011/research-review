package com.example.researchreview.exceptions

class TooManyCodeRequestException(
    val retryAfterSeconds: Long = 0
): Exception() {
    override val message: String
        get() = "auth.tooManyRequests"
}