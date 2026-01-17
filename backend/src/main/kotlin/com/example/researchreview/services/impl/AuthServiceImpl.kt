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
import com.example.researchreview.services.UsersService
import com.example.researchreview.services.Tokens
import com.example.researchreview.utils.*
import org.apache.http.client.utils.URIBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
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

    private fun emailKey(email: String) = "email:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}"
    private fun resendKey(email: String) = "resend:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}"
    private fun resendCountKey(email: String) = "resend-count:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}"
    private fun verifyKey(email: String) = "verify:${CodeGen.hmacSha512(redisKeySecret, normalizeEmail(email))}"

    override fun signUpWithMail(email: String){
        if (usersService.getByEmail(email) !== null) {
            throw EmailExistedException("Email already exists")
        }
        if (redisTemplate.opsForValue().get(emailKey(email)) !== null) {
            throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code")
        }
        if (redisTemplate.opsForValue().get(verifyKey(email)) == "verified") {
            throw VerifiedEmailException()
        }
        sendMagicLink(email, true)
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

    override fun signInWithMail(email: String) {
        if (usersService.getByEmail(email) === null) {
            throw UserNotFoundException()
        }
        // reset resend keys so the user can request again immediately for sign-in
        redisTemplate.delete(resendKey(email))
        redisTemplate.delete(resendCountKey(email))
        sendMagicLink(email, false)
    }

    override fun sendMagicLink(email: String, isSignUp: Boolean) {
        val rKey = resendKey(email)
        val rCountKey = resendCountKey(email)
        val eKey = emailKey(email)

        val resendCount = redisTemplate.opsForValue().get(rCountKey)?.toIntOrNull() ?: 0
        val waitTime = when (resendCount) {
            0 -> 30L
            1 -> 60L
            else -> 120L
        }

        if (redisTemplate.opsForValue().get(rKey) != null) {
            throw TooManyCodeRequestException()
        }

        val token = CodeGen.genCode()
        // store hashed token, not the raw token
        redisTemplate.opsForValue().set(eKey, CodeGen.sha512(token), 5, TimeUnit.MINUTES)
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
            message = "Please use the following code to sign up:  $url",
            template = "signup-email"
        )
    }

    override fun verifyMagicLink(email: String, token: String, isSignUp: Boolean): Tokens? {
        val eKey = emailKey(email)
        val storedHash = redisTemplate.opsForValue().get(eKey) ?: throw TokenInvalidException()
        val providedHash = CodeGen.sha512(token)

        val storedBytes = try { Base64.getDecoder().decode(storedHash) } catch (_: IllegalArgumentException) { null }
        val providedBytes = try { Base64.getDecoder().decode(providedHash) } catch (_: IllegalArgumentException) { null }

        if (storedBytes == null || providedBytes == null || !MessageDigest.isEqual(storedBytes, providedBytes)) {
            throw TokenInvalidException()
        }

        return if (isSignUp) {
            // Mark email as verified for sign up (7 days)
            redisTemplate.opsForValue().set(verifyKey(email), "verified", 7, TimeUnit.DAYS)
            redisTemplate.delete(eKey)
            redisTemplate.delete(resendKey(email))
            redisTemplate.delete(resendCountKey(email))
            null
        } else {
            val user = usersService.getByEmail(email) ?: throw TokenInvalidException()
            // issue tokens and set refresh httpOnly cookie on the current response
            val tokens = try {
                val issued = jwtService.issueTokensForUser(user.id, buildAuthorities(user.role, user.roles))
                setCookiesFromTokens(issued, getCurrentResponse())
                redisTemplate.delete(eKey)
                redisTemplate.delete(resendKey(email))
                redisTemplate.delete(resendCountKey(email))
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
            val tokens = jwtService.refreshTokens(userId, refreshToken, buildAuthorities(user.role, user.roles))
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
        val tokens = jwtService.issueTokensForUser(userId, buildAuthorities(user.role, user.roles))
        val resp = getCurrentResponse() ?: return
        setCookiesFromTokens(tokens, resp)
    }

    private fun buildAuthorities(role: String?, roles: List<String>? = null): List<String> {
        val base = roles?.filter { it.isNotBlank() }?.takeIf { it.isNotEmpty() }
            ?: role?.takeIf { it.isNotBlank() }?.let { listOf(it) }
            ?: emptyList()
        return base.map { it.uppercase() }.distinct()
    }

    private fun setCookiesFromTokens(tokens: com.example.researchreview.services.Tokens, response: HttpServletResponse?) {
        if (response == null) return
        // only set refresh cookie (HttpOnly) — access token will be returned in response body for FE store
        val refreshCookie = Cookie("refresh_token", tokens.refreshToken)
        refreshCookie.isHttpOnly = true
        refreshCookie.secure = true
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
        refreshCookie.secure = true
        response.addCookie(refreshCookie)
    }
}