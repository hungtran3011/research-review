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
    fun createAccessToken(subject: String, authorities: List<String> = emptyList()): Pair<String, Instant>
    fun createRefreshToken(subject: String): Pair<String, Instant>
    fun issueTokensForUser(userId: String, authorities: List<String> = emptyList()): Tokens
    fun validateAccessToken(token: String): Jwt
    fun refreshTokens(userId: String, providedRefreshToken: String, authorities: List<String> = emptyList()): Tokens
    fun revokeRefreshForUser(userId: String)
}