package com.example.researchreview.services.impl

import com.example.researchreview.exceptions.InternalErrorException
import com.example.researchreview.exceptions.SendEmailFailedException
import com.example.researchreview.services.EmailService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mail.MailException
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
        cc: List<String>?,
        bcc: List<String>?,
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
        cc?.takeIf { it.isNotEmpty() }?.toTypedArray()?.let { helper.setCc(it) }
        bcc?.takeIf { it.isNotEmpty() }?.toTypedArray()?.let { helper.setBcc(it) }
        helper.setSubject(subject)
        helper.setText(message, true)
        if (attachment != null) {
            for ((filename, bytes) in attachment) {
                helper.addAttachment(filename, org.springframework.core.io.ByteArrayResource(bytes))
            }
        }
        try {
            emailSender.send(mimeMessage)
        }
        catch (e: MailException) {
            println(e)
            throw SendEmailFailedException()
        }
        catch (e: Exception) {
            println(e)
            throw InternalErrorException()
        }
    }

}