package com.example.researchreview.services.impl

import com.example.researchreview.exceptions.EmailExistedException
import com.example.researchreview.exceptions.VerifiedEmailException
import com.example.researchreview.services.AuthService
import com.example.researchreview.services.EmailService
import com.example.researchreview.services.UsersService
import com.example.researchreview.utils.CodeGen
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import org.apache.http.client.utils.URIBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.concurrent.TimeUnit

@Service
class AuthServiceImpl(
    private val emailService: EmailService,
    private val usersService: UsersService,
    private val redisTemplate: RedisTemplate<String, String>,
): AuthService {

    @Value("\${custom.front-end-url}")
    private val frontendUrl: String = ""

    override fun signUpWithMail(email: String){
        if (usersService.getByEmail(email) !== null) {
            throw EmailExistedException("Email already exists")
        }
        if (redisTemplate.opsForValue().get(email) !== null) {
            throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code")
        }
        if (redisTemplate.opsForValue().get("verify-${email}") == "verified") {
            throw VerifiedEmailException()
        }
        sendMagicLink(email)
    }

    override fun signInWithMail(email: String) {
        TODO("Not yet implemented")
    }

    override fun sendMagicLink(email: String) {
        val resendKey = "resend-$email"
        val resendCountKey = "resend-count-$email"
        val resendCount = redisTemplate.opsForValue().get(resendCountKey)?.toIntOrNull()?.plus(1) ?: 0
        val waitTime = when (resendCount) {
            0 -> 30L
            1 -> 60L
            else -> 120L
        }
        redisTemplate.opsForValue().get(resendKey)?.let {
            throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code")
        }
        val codeGen = CodeGen()
        val token = codeGen.genCode()
        redisTemplate.opsForValue().set(email, token, 5, TimeUnit.MINUTES)
        redisTemplate.opsForValue().set(resendKey, email, waitTime, TimeUnit.SECONDS)
        redisTemplate.opsForValue().set(resendCountKey, (resendCount + 1).toString())
        val url = URIBuilder(frontendUrl)
        url.addParameter("token", token)
        url.addParameter("email", email)
        emailService.sendEmail(
            to = listOf(email),
            subject = "Research Review Signup",
            message = "Please use the following code to sign up:  $url",
            template = "signup-email"
        )
    }

    override fun verifyMagicLink(email: String, token: String, isSignUp: Boolean): Boolean {
        redisTemplate.opsForValue().get(email)?.let {
            if (it != token) {
                throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token")
            }
        }
        println(email)
        redisTemplate.delete(email)
        redisTemplate.delete("resend-$email")
        redisTemplate.delete("resend-count-$email")
        if (isSignUp) {
            // Mark email as verified for sign up
            // Valid for 7 days
            redisTemplate.opsForValue().set("verify-${email}", "verified", 7, TimeUnit.DAYS)
        }
        else {
            if (usersService.getByEmail(email) === null) {
                throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token")
            }
        }
        return true
    }

    override fun signOut() {
        TODO("Not yet implemented")
    }
}