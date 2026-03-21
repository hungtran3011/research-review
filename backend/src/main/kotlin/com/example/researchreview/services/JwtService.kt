package com.example.researchreview.services

import org.springframework.security.oauth2.jwt.Jwt
import java.time.Instant

// Tokens type used by JwtService - declared here (service contract)
data class Tokens(
    val accessToken: String,
    val accessExpiresAt: Instant,
    val refreshToken: String,
    val refreshExpiresAt: Instant
)

interface JwtService {
    fun createAccessToken(subject: String, authorities: List<String> = emptyList(), deviceFingerprintHash: String? = null): Pair<String, Instant>
    fun createRefreshToken(subject: String, deviceFingerprintHash: String? = null): Pair<String, Instant>
    fun issueTokensForUser(userId: String, authorities: List<String> = emptyList(), deviceFingerprintHash: String? = null): Tokens
    fun validateAccessToken(token: String): Jwt
    fun refreshTokens(userId: String, providedRefreshToken: String, authorities: List<String> = emptyList(), deviceFingerprintHash: String? = null): Tokens
    fun revokeRefreshForUser(userId: String)
}