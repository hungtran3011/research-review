package com.example.researchreview.utils

object JwtUtil {
    // Use existing CodeGen.sha512 to produce the token hash (base64-encoded) instead of reimplementing SHA-256 here.
    fun hashToken(token: String): String {
        return CodeGen.sha512(token)
    }

    fun constantTimeEquals(a: String, b: String): Boolean {
        if (a.length != b.length) return false
        var result = 0
        for (i in a.indices) {
            result = result or (a[i].code xor b[i].code)
        }
        return result == 0
    }
}