package com.example.researchreview.services.impl

import com.example.researchreview.services.EmailService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

@Service
class EmailServiceImpl(
    private val emailSender: JavaMailSender
): EmailService {
    override fun sendEmail(
        to: List<String>,
        subject: String,
        message: String,
        template: String,
        attachment: Map<String, ByteArray>?
    ) {
        val mimeMessage = emailSender.createMimeMessage()
        val helper = MimeMessageHelper(
            mimeMessage, attachment != null && attachment.isNotEmpty()
        )
        helper.setTo(to.toTypedArray())
        helper.setSubject(subject)
        helper.setText(message, true)
        if (attachment != null) {
            for ((filename, bytes) in attachment) {
                helper.addAttachment(filename, org.springframework.core.io.ByteArrayResource(bytes))
            }
        }
        emailSender.send(mimeMessage)
    }

}