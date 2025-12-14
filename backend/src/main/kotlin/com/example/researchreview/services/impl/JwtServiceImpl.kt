package com.example.researchreview.services.impl

import com.example.researchreview.services.JwtService
import com.example.researchreview.services.Tokens
import com.example.researchreview.utils.JwtUtil
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID
import java.util.concurrent.TimeUnit

@Service
class JwtServiceImpl(
    private val jwtEncoder: JwtEncoder,
    private val jwtDecoder: JwtDecoder,
    private val redisTemplate: RedisTemplate<String, String>,
    @Value("\${custom.access-expiration:900}") private val accessExpiryMillisecs: Long = 900,
    @Value("\${custom.refresh-expiration:1209600}") private val refreshExpiryMillisecs: Long = 1209600
) : JwtService {

    private fun refreshRedisKey(userId: String) = "refresh:$userId"

    // Removed default value from `authorities` here because overrides must not declare defaults
    override fun createAccessToken(subject: String, authorities: List<String>): Pair<String, Instant> {
        val now = Instant.now()
        val exp = now.plusSeconds(accessExpiryMillisecs)
        val claims = JwtClaimsSet.builder()
            .issuer("research-review")
            .issuedAt(now)
            .expiresAt(exp)
            .subject(subject)
            .id(UUID.randomUUID().toString())
            .claim("roles", authorities)
            .build()
        val token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
        return token to exp
    }

    override fun createRefreshToken(subject: String): Pair<String, Instant> {
        val now = Instant.now()
        val exp = now.plusMillis(refreshExpiryMillisecs)
        val claims = JwtClaimsSet.builder()
            .issuer("research-review")
            .issuedAt(now)
            .expiresAt(exp)
            .subject(subject)
            .id(UUID.randomUUID().toString()) // jti
            .claim("typ", "refresh")
            .build()
        val token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).tokenValue
        return token to exp
    }

    override fun issueTokensForUser(userId: String, authorities: List<String>): Tokens {
        val (access, accessExp) = createAccessToken(userId, authorities)
        val (refresh, refreshExp) = createRefreshToken(userId)
        val hashed = JwtUtil.hashToken(refresh)
        val key = refreshRedisKey(userId)
        redisTemplate.opsForValue().set(key, hashed, refreshExpiryMillisecs, TimeUnit.MILLISECONDS)
        return Tokens(access, accessExp, refresh, refreshExp)
    }

    override fun validateAccessToken(token: String): Jwt = jwtDecoder.decode(token)

    @Throws(RuntimeException::class)
    override fun refreshTokens(userId: String, providedRefreshToken: String, authorities: List<String>): Tokens {
        val key = refreshRedisKey(userId)
        val storedHash = redisTemplate.opsForValue().get(key) ?: throw RuntimeException("Refresh token not found")
        val providedHash = JwtUtil.hashToken(providedRefreshToken)
        if (!JwtUtil.constantTimeEquals(storedHash, providedHash)) {
            // possible token reuse attack — revoke stored token
            redisTemplate.delete(key)
            throw RuntimeException("Invalid refresh token")
        }

        // rotate: issue new tokens and replace stored refresh hash
        val (access, accessExp) = createAccessToken(userId, authorities)
        val (newRefresh, newRefreshExp) = createRefreshToken(userId)
        val newHash = JwtUtil.hashToken(newRefresh)
        redisTemplate.opsForValue().set(key, newHash, refreshExpiryMillisecs, TimeUnit.MILLISECONDS)
        return Tokens(access, accessExp, newRefresh, newRefreshExp)
    }

    override fun revokeRefreshForUser(userId: String) {
        val key = refreshRedisKey(userId)
        redisTemplate.delete(key)
    }
}