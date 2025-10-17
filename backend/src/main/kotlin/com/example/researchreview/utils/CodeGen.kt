package com.example.researchreview.utils

import java.security.SecureRandom
import java.util.Base64

class CodeGen {
    fun genCode(): String {
        var rand = SecureRandom()
        var double = rand.nextDouble();
        var code = toBase64(double.toString().toByteArray())
        return code

    }

    fun toBase64(byteArray: ByteArray): String {
        return Base64.getEncoder().encode(byteArray).toString(Charsets.UTF_8)
    }
}