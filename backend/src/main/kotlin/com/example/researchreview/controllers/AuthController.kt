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
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService,
    private val messageSource: MessageSource,
) {

    private fun msg(code: String): String = messageSource.getMessage(code, null, LocaleContextHolder.getLocale())

    @PostMapping("/signup")
    fun signUp(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val now = Instant.now().epochSecond
        try {
            val sendResult = authService.signUpWithMail(request.email, request.deviceFingerprint)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = msg("auth.magicLinkSent"),
                    data = AuthResponseDto(
                        success = true,
                        message = msg("auth.magicLinkSent"),
                        canResendAt = now + sendResult.cooldownSeconds,
                        attemptsRemaining = sendResult.attemptsRemaining
                    )
                )
            )
        } catch (e: TooManyCodeRequestException) {
            val retryAfter = e.retryAfterSeconds
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(BaseResponseDto(
                code = 429,
                message = msg("auth.tooManyRequests"),
                data = AuthResponseDto(
                    success = false,
                    message = msg("auth.tooManyRequests"),
                    canResendAt = now + retryAfter,
                    attemptsRemaining = 0
                )
            ))
        } catch (_: EmailExistedException) {
            return ResponseEntity.badRequest().body(BaseResponseDto(
                code = 400,
                message = msg("auth.emailExists"),
                data = AuthResponseDto(success = false, message = msg("auth.emailExists"))
            ))
        } catch (_: VerifiedEmailException) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = msg("auth.emailAlreadyVerified"),
                    data = AuthResponseDto(success = false, message = msg("auth.emailAlreadyVerified"))
                )
            )
        } catch (_: Exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = msg("auth.internalServer"),
                    data = AuthResponseDto(success = false, message = msg("auth.internalServer"))
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
                    message = msg("auth.magicLinkSent"),
                    data = AuthResponseDto(
                        success = true,
                        message = msg("auth.magicLinkSent"),
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
                    message = msg("auth.tooManyRequests"),
                    data = AuthResponseDto(
                        success = false,
                        message = msg("auth.tooManyRequests"),
                        canResendAt = now + retryAfter,
                        attemptsRemaining = 0
                    )
                )
            )
        } catch (e: SendEmailFailedException) {
            return ResponseEntity.status(HttpStatus.FAILED_DEPENDENCY).body(
                BaseResponseDto(
                    code = 424,
                    message = msg("auth.failedSendEmail"),
                    data = AuthResponseDto(success = false, message = msg("auth.failedSendEmail"))
                )
            )
        } catch (e: InternalErrorException) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = msg("auth.internalServer"),
                    data = AuthResponseDto(success = false, message = msg("auth.internalServer"))
                )
            )
        } catch (_: Exception) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = msg("auth.failedSendEmail"),
                    data = AuthResponseDto(success = false, message = msg("auth.failedSendEmail"))
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
                        message = msg("auth.tokenVerified"),
                        data = AuthResponseDto(
                            success = true,
                            message = msg("auth.tokenVerified"),
                            accessToken = issuedTokens?.accessToken,
                            refreshToken = null
                        )
                    )
                )
            } else {
                ResponseEntity.badRequest().body(
                    BaseResponseDto(
                        code = 400,
                        message = msg("auth.invalidToken"),
                        data = AuthResponseDto(
                            success = false,
                            message = msg("auth.invalidToken")
                        )
                    )
                )
            }
        } catch (e: TokenInvalidException) {
            return ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = msg("auth.invalidToken"),
                    data = AuthResponseDto(success = false, message = msg("auth.invalidToken"))
                )
            )
        } catch (e: Exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = msg("auth.internalServer"),
                    data = AuthResponseDto(success = false, message = msg("auth.internalServer"))
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
                    message = msg("auth.tokensRefreshed"),
                    data = AuthResponseDto(
                        success = true,
                        message = msg("auth.tokensRefreshed"),
                        accessToken = tokens.accessToken,
                        refreshToken = null
                    )
                )
            )
        } catch (_: TokenInvalidException) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                BaseResponseDto(
                    code = 401,
                    message = msg("auth.invalidToken"),
                    data = AuthResponseDto(success = false, message = msg("auth.invalidToken"))
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
                    message = msg("auth.newMagicLinkSent"),
                    data = AuthResponseDto(
                        success = true,
                        message = msg("auth.newMagicLinkSent"),
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
                    message = msg("auth.tooManyRequests"),
                    data = AuthResponseDto(
                        success = false,
                        message = msg("auth.tooManyRequests"),
                        canResendAt = now + retryAfter,
                        attemptsRemaining = 0
                    )
                )
            )
        } catch (e: SendEmailFailedException) {
            return ResponseEntity.status(HttpStatus.FAILED_DEPENDENCY).body(
                BaseResponseDto(
                    code = 424,
                    message = msg("auth.failedSendEmail"),
                    data = AuthResponseDto(success = false, message = msg("auth.failedSendEmail"))
                )
            )
        } catch (e: InternalErrorException) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = msg("auth.internalServer"),
                    data = AuthResponseDto(success = false, message = msg("auth.internalServer"))
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
                message = msg("auth.signedOut")
            )
        )
    }
}