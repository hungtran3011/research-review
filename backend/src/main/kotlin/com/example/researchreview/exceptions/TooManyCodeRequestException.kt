package com.example.researchreview.exceptions

class TooManyCodeRequestException: Exception() {
    override val message: String
        get() = "Too many code requests, please try again later"
}