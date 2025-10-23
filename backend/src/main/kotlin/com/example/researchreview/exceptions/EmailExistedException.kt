package com.example.researchreview.exceptions

class EmailExistedException(
    val email: String
): Exception() {
    override val message: String
        get() = "Email is already existed"
}