package com.example.researchreview.utils

import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.security.KeyFactory
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.Base64

object KeyUtils {
    private fun resolvePemContent(pemOrPath: String): String {
        val value = pemOrPath.trim()
        if (value.isEmpty()) return value

        // If it already looks like PEM content, use it directly.
        if (value.contains("-----BEGIN")) return value

        // Otherwise, treat it as a file path (common in local/dev).
        val path = Path.of(value)
        if (Files.exists(path) && Files.isRegularFile(path)) {
            return Files.readString(path, StandardCharsets.UTF_8)
        }

        // Fall back to the original value (e.g., env var containing inline key material).
        return value
    }

    fun publicKeyFromPem(pem: String): RSAPublicKey {
        val resolvedPem = resolvePemContent(pem)
        val cleaned = resolvedPem
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replace("\\s".toRegex(), "")
        val decoded = Base64.getDecoder().decode(cleaned)
        val spec = X509EncodedKeySpec(decoded)
        val kf = KeyFactory.getInstance("RSA")
        return kf.generatePublic(spec) as RSAPublicKey
    }

    fun privateKeyFromPem(pem: String): RSAPrivateKey {
        val resolvedPem = resolvePemContent(pem)
        val cleaned = resolvedPem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")
        val decoded = Base64.getDecoder().decode(cleaned)
        val spec = PKCS8EncodedKeySpec(decoded)
        val kf = KeyFactory.getInstance("RSA")
        return kf.generatePrivate(spec) as RSAPrivateKey
    }
}

