package com.example.researchreview.controllers

import com.example.researchreview.dtos.BasicEmailDto
import com.example.researchreview.services.EmailService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/test")
class TestController(
    private val emailService: EmailService
) {

    @GetMapping("/")
    fun test() = "Hello World! Test complete"

    @PostMapping("/email")
    fun testEmail(@RequestBody body: BasicEmailDto) {
        emailService.sendEmail(
            to = body.to,
            subject = body.subject,
            message = body.message,
            template = body.template,
        )
    }
}