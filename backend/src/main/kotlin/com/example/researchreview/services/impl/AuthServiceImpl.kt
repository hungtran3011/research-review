package com.example.researchreview.services.impl

import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.exceptions.EmailExistedException
import com.example.researchreview.exceptions.TokenInvalidException
import com.example.researchreview.exceptions.TooManyCodeRequestException
import com.example.researchreview.exceptions.UserNotFoundException
import com.example.researchreview.exceptions.VerifiedEmailException
import com.example.researchreview.services.AuthService
import com.example.researchreview.services.EmailService
import com.example.researchreview.services.JwtService
import com.example.researchreview.services.MagicLinkSendResult
import com.example.researchreview.services.UsersService
import com.example.researchreview.services.Tokens
import com.example.researchreview.utils.*
import org.apache.http.client.utils.URIBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.util.Base64
import java.util.concurrent.TimeUnit
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletResponse

@Service
class AuthServiceImpl(
    private val emailService: EmailService,
    private val usersService: UsersService,
    private val redisTemplate: RedisTemplate<String, String>,
    private val jwtService: JwtService,
): AuthService {

    @Value("\${custom.front-end-url}")
    private val frontendUrl: String = ""

    // Secret used to HMAC emails for Redis keys. Inject from config (keep secret).
    @Value("\${custom.redis-key-secret}")
    private val redisKeySecret: String = ""

    private fun normalizeEmail(email: String) = email.trim().lowercase()

    private fun fingerprintHash(deviceFingerprint: String?): String {
        val raw = deviceFingerprint?.trim().orEmpty()
        if (raw.isBlank()) return "no-device"
        return CodeGen.hmacSha512(redisKeySecret, raw)
    }

    private fun magicPayload(tokenHash: String, fpHash: String): String = "$tokenHash.$fpHash"

    private fun parseMagicPayload(payload: String): Pair<String, String>? {
        val idx = payload.lastIndexOf('.')
        if (idx <= 0 || idx >= payload.length - 1) return null
        val tokenHash = payload.substring(0, idx)
        val fpHash = payload.substring(idx + 1)
        if (tokenHash.isBlank() || fpHash.isBlank()) return null
        return tokenHash to fpHash
    }

    private fun emailKey(email: String, deviceFingerprint: String?) = "email:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}:${fingerprintHash(deviceFingerprint)}"
    private fun resendKey(email: String, deviceFingerprint: String?) = "resend:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}:${fingerprintHash(deviceFingerprint)}"
    private fun resendCountKey(email: String, deviceFingerprint: String?) = "resend-count:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}:${fingerprintHash(deviceFingerprint)}"
    private fun verifyKey(email: String) = "verify:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}"

    override fun signUpWithMail(email: String, deviceFingerprint: String?): MagicLinkSendResult {
        if (usersService.getByEmail(email) !== null) {
            throw EmailExistedException("auth.emailExists")
        }
        if (redisTemplate.opsForValue().get(emailKey(email, deviceFingerprint)) !== null) {
            val ttl = redisTemplate.getExpire(emailKey(email, deviceFingerprint), TimeUnit.SECONDS)?.coerceAtLeast(0)
            throw TooManyCodeRequestException(ttl ?: 30)
        }
        if (redisTemplate.opsForValue().get(verifyKey(email)) == "verified") {
            throw VerifiedEmailException()
        }
        return sendMagicLink(email, true, deviceFingerprint)
    }

    override fun signUpInfo(info: UserRequestDto) {
        val email = normalizeEmail(info.email)
        val vKey = verifyKey(email)
        val verified = redisTemplate.opsForValue().get(vKey)
        if (verified != "verified") {
            throw TokenInvalidException()
        }

        // create the user
        val created = usersService.create(info)
        // clear verification flag
        redisTemplate.delete(vKey)

        // issue tokens and set as httpOnly cookies so client receives them immediately
        try {
            setTokensAsCookiesForUser(created.id)
        } catch (e: Exception) {
            // don't fail creation if cookie setting fails (may be non-web context)
        }
    }

    override fun signInWithMail(email: String, deviceFingerprint: String?): MagicLinkSendResult {
        if (usersService.getByEmail(email) === null) {
            throw UserNotFoundException()
        }
        // reset resend keys so the user can request again immediately for sign-in
        redisTemplate.delete(resendKey(email, deviceFingerprint))
        redisTemplate.delete(resendCountKey(email, deviceFingerprint))
        return sendMagicLink(email, false, deviceFingerprint)
    }

    override fun sendMagicLink(email: String, isSignUp: Boolean, deviceFingerprint: String?): MagicLinkSendResult {
        val rKey = resendKey(email, deviceFingerprint)
        val rCountKey = resendCountKey(email, deviceFingerprint)
        val eKey = emailKey(email, deviceFingerprint)
        val fpHash = fingerprintHash(deviceFingerprint)

        val resendCount = redisTemplate.opsForValue().get(rCountKey)?.toIntOrNull() ?: 0
        val waitTime = when (resendCount) {
            0 -> 30L
            1 -> 60L
            else -> 120L
        }

        if (redisTemplate.opsForValue().get(rKey) != null) {
            val ttl = redisTemplate.getExpire(rKey, TimeUnit.SECONDS)?.coerceAtLeast(0)
            throw TooManyCodeRequestException(ttl ?: 30)
        }

        val token = CodeGen.genCode()
        // store hashed token, not the raw token
        redisTemplate.opsForValue().set(eKey, magicPayload(CodeGen.sha512(token), fpHash), 5, TimeUnit.MINUTES)
        // set resend lock and increment resend counter
        redisTemplate.opsForValue().set(rKey, "1", waitTime, TimeUnit.SECONDS)
        redisTemplate.opsForValue().set(rCountKey, (resendCount + 1).toString())

        val url = URIBuilder(frontendUrl)
        url.path = "/verify"
        url.addParameter("token", token)
        url.addParameter("email", email)
        url.addParameter("isSignUp", isSignUp.toString())
        emailService.sendEmail(
            to = listOf(email),
            subject = "Research Review Signup",
            message = """
                <p>Please use the following link to continue:</p>
                <p><a href="$url">$url</a></p>
            """.trimIndent(),
            template = "signup-email"
        )

        val attemptsRemaining = (3 - (resendCount + 1)).coerceAtLeast(0)
        return MagicLinkSendResult(cooldownSeconds = waitTime, attemptsRemaining = attemptsRemaining)
    }

    override fun verifyMagicLink(email: String, token: String, isSignUp: Boolean, deviceFingerprint: String?): Tokens? {
        val eKey = emailKey(email, deviceFingerprint)
        val storedPayload = redisTemplate.opsForValue().get(eKey) ?: throw TokenInvalidException()
        val (storedHash, storedFpHash) = parseMagicPayload(storedPayload) ?: throw TokenInvalidException()
        val providedHash = CodeGen.sha512(token)
        val providedFpHash = fingerprintHash(deviceFingerprint)

        val storedBytes = try { Base64.getDecoder().decode(storedHash) } catch (_: IllegalArgumentException) { null }
        val providedBytes = try { Base64.getDecoder().decode(providedHash) } catch (_: IllegalArgumentException) { null }

        // Fingerprint hashes are encoded with URL-safe Base64 (CodeGen.hmacSha512 uses URL encoder).
        // Also support the sentinel value "no-device" when no fingerprint was provided.
        val storedFpBytes = if (storedFpHash == "no-device") null else try { Base64.getUrlDecoder().decode(storedFpHash) } catch (_: IllegalArgumentException) { null }
        val providedFpBytes = if (providedFpHash == "no-device") null else try { Base64.getUrlDecoder().decode(providedFpHash) } catch (_: IllegalArgumentException) { null }

        val tokenMatch = storedBytes != null && providedBytes != null && MessageDigest.isEqual(storedBytes, providedBytes)
        val fpMatch = if (storedFpHash == "no-device" && providedFpHash == "no-device") {
            true
        } else {
            storedFpBytes != null && providedFpBytes != null && MessageDigest.isEqual(storedFpBytes, providedFpBytes)
        }

        if (!tokenMatch || !fpMatch) {
            throw TokenInvalidException()
        }

        return if (isSignUp) {
            // Mark email as verified for sign up (7 days)
            redisTemplate.opsForValue().set(verifyKey(email), "verified", 7, TimeUnit.DAYS)
            redisTemplate.delete(eKey)
            redisTemplate.delete(resendKey(email, deviceFingerprint))
            redisTemplate.delete(resendCountKey(email, deviceFingerprint))
            null
        } else {
            val user = usersService.getByEmail(email) ?: throw TokenInvalidException()
            // issue tokens and set refresh httpOnly cookie on the current response
            val tokens = try {
                val issued = jwtService.issueTokensForUser(user.id, buildAuthorities(user.globalRole), providedFpHash)
                setCookiesFromTokens(issued, getCurrentResponse())
                redisTemplate.delete(eKey)
                redisTemplate.delete(resendKey(email, deviceFingerprint))
                redisTemplate.delete(resendCountKey(email, deviceFingerprint))
                issued
            } catch (e: Exception) {
                // fallback: treat any failure as token invalid
                throw TokenInvalidException()
            }
            tokens
        }
    }

    override fun signOut() {
        // try to get current user id from security context
        val userId = getCurrentUserId() ?: return
        // revoke refresh token stored in redis
        jwtService.revokeRefreshForUser(userId)

        // clear cookies on response
        val resp = getCurrentResponse()
        clearAuthCookies(resp)
    }

    override fun refreshAccessToken(): Tokens {
        try {
            // read refresh token from cookie
            val respAttrs = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
            val request = respAttrs?.request ?: throw TokenInvalidException()
            val refreshToken = request.cookies?.firstOrNull { it.name == "refresh_token" }?.value
                ?: throw TokenInvalidException()

            // decode refresh token to extract subject (user id)
            val jwt: Jwt = jwtService.validateAccessToken(refreshToken)
            val userId = jwt.subject
            val user = usersService.getById(userId)
            val deviceFpHash = jwt.getClaimAsString("device_fp")
            val tokens = jwtService.refreshTokens(userId, refreshToken, buildAuthorities(user.globalRole), deviceFpHash)
            // set rotated refresh cookie on response if available
            try {
                setCookiesFromTokens(tokens, getCurrentResponse())
            } catch (_: Exception) {
                // ignore if no response available
            }
            return tokens
        } catch (e: Exception) {
            throw TokenInvalidException()
        }
    }

    private fun getCurrentUserId(): String? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        val principal = auth.principal ?: return null
        return when (principal) {
            is Jwt -> principal.subject
            is String -> principal
            else -> principal.toString()
        }
    }

    private fun getCurrentResponse(): HttpServletResponse? {
        val attrs = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes ?: return null
        return attrs.response
    }

    private fun setTokensAsCookiesForUser(userId: String?) {
        if (userId.isNullOrBlank()) return
        val user = try {
            usersService.getById(userId)
        } catch (_: Exception) {
            null
        } ?: return
        val tokens = jwtService.issueTokensForUser(userId, buildAuthorities(user.globalRole))
        val resp = getCurrentResponse() ?: return
        setCookiesFromTokens(tokens, resp)
    }

    private fun buildAuthorities(globalRole: String?): List<String> {
        val normalizedRole = globalRole?.trim()?.takeIf { it.isNotBlank() }?.uppercase() ?: "USER"
        return listOf(normalizedRole)
    }

    private fun setCookiesFromTokens(tokens: com.example.researchreview.services.Tokens, response: HttpServletResponse?) {
        if (response == null) return
        // only set refresh cookie (HttpOnly) — access token will be returned in response body for FE store
        val refreshCookie = Cookie("refresh_token", tokens.refreshToken)
        refreshCookie.isHttpOnly = true
        refreshCookie.secure = shouldUseSecureCookies()
        refreshCookie.path = "/"
        refreshCookie.maxAge = (tokens.refreshExpiresAt.epochSecond - java.time.Instant.now().epochSecond).toInt()
        response.addCookie(refreshCookie)
    }

    private fun clearAuthCookies(response: HttpServletResponse?) {
        if (response == null) return
        // clear refresh cookie
        val refreshCookie = Cookie("refresh_token", "")
        refreshCookie.path = "/"
        refreshCookie.maxAge = 0
        refreshCookie.isHttpOnly = true
        refreshCookie.secure = shouldUseSecureCookies()
        response.addCookie(refreshCookie)
    }

    private fun shouldUseSecureCookies(): Boolean {
        val attrs = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes ?: return false
        val request = attrs.request
        val forwardedProto = request.getHeader("X-Forwarded-Proto")?.lowercase()
        return request.isSecure || forwardedProto == "https"
    }
}