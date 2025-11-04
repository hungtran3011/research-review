package com.example.researchreview.exceptions

class InternalErrorException: Exception() {
    override val message: String
        get() = "Internal server error"
}