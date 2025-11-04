package com.example.researchreview.controllers

import com.example.researchreview.constants.AuthBusinessCode
import com.example.researchreview.constants.EmailBusinessCode
import com.example.researchreview.dtos.AuthRequestDto
import com.example.researchreview.dtos.AuthResponseDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.VerifyTokenRequestDto
import com.example.researchreview.exceptions.EmailExistedException
import com.example.researchreview.exceptions.InternalErrorException
import com.example.researchreview.exceptions.SendEmailFailedException
import com.example.researchreview.exceptions.TokenInvalidException
import com.example.researchreview.exceptions.VerifiedEmailException
import com.example.researchreview.services.AuthService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/signup")
    fun signUp(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        try {
            authService.signUpWithMail(request.email)
        } catch (_: EmailExistedException) {
            return ResponseEntity.ok(BaseResponseDto(
                code = AuthBusinessCode.USER_ALREADY_EXISTS.value,
                message = "Email already exists",
                data = AuthResponseDto(success = false, message = "Email already exists")
            ))
        } catch (_: VerifiedEmailException) {
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = AuthBusinessCode.EMAIL_VERIFIED.value,
                    message = "Email is already verified",
                    data = AuthResponseDto(success = false, message = "Email is already verified")
                )
            )
        } catch (_: Exception) {
            return ResponseEntity.internalServerError().body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error",
                    data = AuthResponseDto(success = false, message = "Internal server error")
                ))
        }
        return ResponseEntity.ok(
            BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY.value,
                message = "Magic link sent to your email",
                data = AuthResponseDto(success = true, message = "Magic link sent to your email")
            )
        )
    }

    @PostMapping("/signin")
    fun signIn(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val (response, statusCode) = try {
            authService.signInWithMail(request.email)
            val resp = BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY.value,
                message = "Magic link sent to your email",
                data = AuthResponseDto(success = true, message = "Magic link sent to your email")
            )
            resp to 200
        } catch (e: SendEmailFailedException) {
            val resp = BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_FAIL.value,
                message = "Failed to send email",
                data = AuthResponseDto(success = false, message = "Failed to send email")
            )
            resp to 424
        } catch (e: InternalErrorException) {
            val resp = BaseResponseDto(
                code = 500,
                message = "Internal server error",
                data = AuthResponseDto(success = false, message = "Internal server error")
            )
            resp to 500
        } catch (_: Exception) {
            val resp = BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_FAIL.value,
                message = "Failed to send email",
                data = AuthResponseDto(success = false, message = "Failed to send email")
            )
            resp to 400
        }
        return if (statusCode == 200) ResponseEntity.ok(response) else ResponseEntity.status(statusCode).body(response)
    }

    @PostMapping("/verify")
    fun verifyToken(@Valid @RequestBody request: VerifyTokenRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val (response, statusCode) = try {
            val isValid = authService.verifyMagicLink(request.email, request.token, request.isSignUp)
            val resp = BaseResponseDto(
                code = if (isValid) AuthBusinessCode.VERIFICATION_SUCCESS.value else AuthBusinessCode.INVALID_TOKEN.value,
                message = if (isValid) "Token verified successfully" else "Invalid token",
                data = AuthResponseDto(success = isValid, message = if (isValid) "Token verified successfully" else "Invalid token")
            )
            resp to if (isValid) 200 else 400
        } catch (e: TokenInvalidException) {
            val resp = BaseResponseDto(
                code = AuthBusinessCode.INVALID_TOKEN.value,
                message = "Invalid token",
                data = AuthResponseDto(success = false, message = "Invalid token")
            )
            resp to 400
        } catch (e: Exception) {
            val resp = BaseResponseDto(
                code = 500,
                message = "Internal server error",
                data = AuthResponseDto(success = false, message = "Internal server error")
            )
            resp to 500
        }

        return if (statusCode == 200) ResponseEntity.ok(response) else ResponseEntity.status(statusCode).body(response)
    }

    @PostMapping("/resend-code")
    fun resendMagicLink(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<BaseResponseDto<AuthResponseDto>> {
        val (response, statusCode) = try {
            authService.sendMagicLink(request.email, request.isSignUp ?: false)
            val resp = BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY.value,
                message = "New magic link sent to your email",
                data = AuthResponseDto(success = true, message = "New magic link sent to your email")
            )
            resp to 200
        } catch (e: SendEmailFailedException) {
            val resp = BaseResponseDto(
                code = EmailBusinessCode.EMAIL_SENT_FAIL.value,
                message = "Failed to send email",
                data = AuthResponseDto(success = false, message = "Failed to send email")
            )
            resp to 424
        } catch (e: InternalErrorException) {
            val resp = BaseResponseDto(
                code = 500,
                message = "Internal server error",
                data = AuthResponseDto(success = false, message = "Internal server error")
            )
            resp to 500
        }

        return if (statusCode == 200) ResponseEntity.ok(response) else ResponseEntity.status(statusCode).body(response)
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