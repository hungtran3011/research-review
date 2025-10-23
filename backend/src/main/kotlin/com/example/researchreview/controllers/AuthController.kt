package com.example.researchreview.controllers

import com.example.researchreview.constants.AuthBusinessCode
import com.example.researchreview.dtos.AuthRequestDto
import com.example.researchreview.dtos.AuthResponseDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.VerifyTokenRequestDto
import com.example.researchreview.exceptions.EmailExistedException
import com.example.researchreview.exceptions.VerifiedEmailException
import com.example.researchreview.services.AuthService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

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
            return ResponseEntity
                .badRequest()
                .body(BaseResponseDto(
                    code = AuthBusinessCode.EMAIL_VERIFIED.value,
                    message = "Email already exists",
                    data = AuthResponseDto(success = false, message = "Email already exists")
                ))
        } catch (_: VerifiedEmailException) {
            return ResponseEntity.status(422).body(
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
                code = AuthBusinessCode.EMAIL_SENT.value,
                message = "Magic link sent to your email",
                data = AuthResponseDto(success = true, message = "Magic link sent to your email")
            )
        )
    }

    @PostMapping("/signin")
    fun signIn(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<AuthResponseDto> {
        authService.signInWithMail(request.email)
        return ResponseEntity.ok(
            AuthResponseDto(
                success = true,
                message = "Magic link sent to your email"
            )
        )
    }

    @PostMapping("/verify")
    fun verifyToken(@Valid @RequestBody request: VerifyTokenRequestDto): ResponseEntity<AuthResponseDto> {
        val isValid = try {
            authService.verifyMagicLink(request.email, request.token, request.isSignUp)
        } catch (e: ResponseStatusException) {
            return ResponseEntity.badRequest().body(AuthResponseDto(success = false, message = e.message))
        }
        return ResponseEntity.ok(
            AuthResponseDto(
                success = isValid,
                message = if (isValid) "Token verified successfully" else "Invalid token"
            )
        )
    }

    @PostMapping("/resend-code")
    fun resendMagicLink(@Valid @RequestBody request: AuthRequestDto): ResponseEntity<AuthResponseDto> {
        authService.sendMagicLink(request.email)
        return ResponseEntity.ok(
            AuthResponseDto(
                success = true,
                message = "New magic link sent to your email"
            )
        )
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