package com.example.researchreview.controllers

import com.example.researchreview.dtos.BasicEmailDto
import com.example.researchreview.services.EmailService
import org.springframework.context.annotation.Profile
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
        emailService.sendEmail(
            to = body.to,
            cc = body.cc,
            bcc = body.bcc,
            subject = body.subject,
            message = body.message,
            template = body.template,
        )
    }
}