package com.example.researchreview.utils

import java.security.SecureRandom
import java.util.Base64

class CodeGen {
    fun genCode(): String {
        val rand = SecureRandom()
        val bytes = ByteArray(64)
        rand.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    fun toBase64(byteArray: ByteArray): String {
        return Base64.getEncoder().encode(byteArray).toString(Charsets.UTF_8)
    }
}