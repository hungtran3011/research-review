package com.example.researchreview.controllers

import com.example.researchreview.dtos.AuthRequestDto
import com.example.researchreview.dtos.AuthResponseDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.VerifyTokenRequestDto
import com.example.researchreview.exceptions.EmailExistedException
import com.example.researchreview.exceptions.InternalErrorException
import com.example.researchreview.exceptions.SendEmailFailedException
import com.example.researchreview.exceptions.TokenInvalidException
import com.example.researchreview.exceptions.TooManyCodeRequestException
import com.example.researchreview.exceptions.VerifiedEmailException
import com.example.researchreview.services.AuthService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/signup")
    fun signUp(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val now = Instant.now().epochSecond
        try {
            val sendResult = authService.signUpWithMail(request.email, request.deviceFingerprint)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Magic link sent to your email",
                    data = AuthResponseDto(
                        success = true,
                        message = "Magic link sent to your email",
                        canResendAt = now + sendResult.cooldownSeconds,
                        attemptsRemaining = sendResult.attemptsRemaining
                    )
                )
            )
        } catch (e: TooManyCodeRequestException) {
            val retryAfter = e.retryAfterSeconds
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(BaseResponseDto(
                code = 429,
                message = "Too many code requests, please try again later",
                data = AuthResponseDto(
                    success = false,
                    message = "Too many code requests, please try again later",
                    canResendAt = now + retryAfter,
                    attemptsRemaining = 0
                )
            ))
        } catch (_: EmailExistedException) {
            return ResponseEntity.badRequest().body(BaseResponseDto(
                code = 400,
                message = "Email already exists",
                data = AuthResponseDto(success = false, message = "Email already exists")
            ))
        } catch (_: VerifiedEmailException) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = "Email is already verified",
                    data = AuthResponseDto(success = false, message = "Email is already verified")
                )
            )
        } catch (_: Exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error",
                    data = AuthResponseDto(success = false, message = "Internal server error")
                )
            )
        }
    }

    @PostMapping("/signin")
    fun signIn(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val now = Instant.now().epochSecond
        try {
            val sendResult = authService.signInWithMail(request.email, request.deviceFingerprint)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Magic link sent to your email",
                    data = AuthResponseDto(
                        success = true,
                        message = "Magic link sent to your email",
                        canResendAt = now + sendResult.cooldownSeconds,
                        attemptsRemaining = sendResult.attemptsRemaining
                    )
                )
            )
        } catch (e: TooManyCodeRequestException) {
            val retryAfter = e.retryAfterSeconds
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                BaseResponseDto(
                    code = 429,
                    message = "Too many code requests, please try again later",
                    data = AuthResponseDto(
                        success = false,
                        message = "Too many code requests, please try again later",
                        canResendAt = now + retryAfter,
                        attemptsRemaining = 0
                    )
                )
            )
        } catch (e: SendEmailFailedException) {
            return ResponseEntity.status(HttpStatus.FAILED_DEPENDENCY).body(
                BaseResponseDto(
                    code = 424,
                    message = "Failed to send email",
                    data = AuthResponseDto(success = false, message = "Failed to send email")
                )
            )
        } catch (e: InternalErrorException) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error",
                    data = AuthResponseDto(success = false, message = "Internal server error")
                )
            )
        } catch (_: Exception) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = "Failed to send email",
                    data = AuthResponseDto(success = false, message = "Failed to send email")
                )
            )
        }
    }

    @PostMapping("/verify")
    fun verifyToken(@Valid @RequestBody request: VerifyTokenRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        try {
            val issuedTokens = authService.verifyMagicLink(request.email, request.token, request.isSignUp, request.deviceFingerprint)
            val success = issuedTokens != null || request.isSignUp
            return if (success) {
                ResponseEntity.ok(
                    BaseResponseDto(
                        code = 200,
                        message = "Token verified successfully",
                        data = AuthResponseDto(
                            success = true,
                            message = "Token verified successfully",
                            accessToken = issuedTokens?.accessToken,
                            refreshToken = null
                        )
                    )
                )
            } else {
                ResponseEntity.badRequest().body(
                    BaseResponseDto(
                        code = 400,
                        message = "Invalid token",
                        data = AuthResponseDto(
                            success = false,
                            message = "Invalid token"
                        )
                    )
                )
            }
        } catch (e: TokenInvalidException) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = "Invalid token",
                    data = AuthResponseDto(success = false, message = "Invalid token")
                )
            )
        } catch (e: Exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error",
                    data = AuthResponseDto(success = false, message = "Internal server error")
                )
            )
        }
    }

    @PostMapping("/refresh", consumes = ["*/*"])
    fun refreshTokens(): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        try {
            val tokens = authService.refreshAccessToken()
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Tokens refreshed successfully",
                    data = AuthResponseDto(
                        success = true,
                        message = "Tokens refreshed successfully",
                        accessToken = tokens.accessToken,
                        refreshToken = null
                    )
                )
            )
        } catch (_: TokenInvalidException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                BaseResponseDto(
                    code = 401,
                    message = "Invalid token",
                    data = AuthResponseDto(success = false, message = "Invalid token")
                )
            )
        }
    }

    @PostMapping("/resend-code")
    fun resendMagicLink(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val now = Instant.now().epochSecond
        try {
            val sendResult = authService.sendMagicLink(request.email, request.isSignUp ?: false, request.deviceFingerprint)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "New magic link sent to your email",
                    data = AuthResponseDto(
                        success = true,
                        message = "New magic link sent to your email",
                        canResendAt = now + sendResult.cooldownSeconds,
                        attemptsRemaining = sendResult.attemptsRemaining
                    )
                )
            )
        } catch (e: TooManyCodeRequestException) {
            val retryAfter = e.retryAfterSeconds
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                BaseResponseDto(
                    code = 429,
                    message = "Too many code requests, please try again later",
                    data = AuthResponseDto(
                        success = false,
                        message = "Too many code requests, please try again later",
                        canResendAt = now + retryAfter,
                        attemptsRemaining = 0
                    )
                )
            )
        } catch (e: SendEmailFailedException) {
            return ResponseEntity.status(HttpStatus.FAILED_DEPENDENCY).body(
                BaseResponseDto(
                    code = 424,
                    message = "Failed to send email",
                    data = AuthResponseDto(success = false, message = "Failed to send email")
                )
            )
        } catch (e: InternalErrorException) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error",
                    data = AuthResponseDto(success = false, message = "Internal server error")
                )
            )
        }
    }

    @PostMapping("/signout")
    fun signOut(): ResponseEntity<AuthResponseDto> {
        authService.signOut()
        return ResponseEntity.ok(
            AuthResponseDto(
                success = true,
                message = "Signed out successfully"
            )
        )
    }
}