package com.example.researchreview.controllers

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.BasicEmailDto
import com.example.researchreview.services.EmailService
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@Profile("!prod")
@RequestMapping("/api/v1/test")
class TestController(
    private val emailService: EmailService
) {

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun test() = "Hello World! Test complete"

    @PostMapping("/email")
    @PreAuthorize("hasRole('ADMIN')")
    fun testEmail(@RequestBody body: BasicEmailDto) {
        try {
            emailService.sendEmail(
                to = body.to,
                cc = body.cc,
                bcc = body.bcc,
                subject = body.subject,
                message = body.message,
                template = body.template,
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    null
                )
            )
        }
    }

    @GetMapping("/ping")
    fun ping(): ResponseEntity<BaseResponseDto<String>> {
        return try {
            ResponseEntity.ok(BaseResponseDto(code = 200, message = "pong", data = "pong"))
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(code = 500, message = ex.message ?: ErrorCode.INTERNAL_SERVER.key, data = null)
            )
        }
    }
}