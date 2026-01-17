package com.example.researchreview.utils

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

object CodeGen{
    fun genCode(): String {
        val rand = SecureRandom()
        val bytes = ByteArray(64)
        rand.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    fun sha256(input: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(input.toByteArray(Charsets.UTF_8))
        return Base64.getEncoder().withoutPadding().encodeToString(digest)
    }

    fun sha512(input: String): String {
        val md = MessageDigest.getInstance("SHA-512")
        val digest = md.digest(input.toByteArray(Charsets.UTF_8))
        return Base64.getEncoder().withoutPadding().encodeToString(digest)
    }

    fun hmacSha512(key: String, input: String): String {
        val mac = javax.crypto.Mac.getInstance("HmacSHA512")
        val secretKey = javax.crypto.spec.SecretKeySpec(key.toByteArray(Charsets.UTF_8), "HmacSHA512")
        mac.init(secretKey)
        val digest = mac.doFinal(input.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest)
    }

    fun toBase64(byteArray: ByteArray): String {
        return Base64.getEncoder().encodeToString(byteArray)
    }
}