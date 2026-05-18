package com.example.researchreview.services.impl

import com.example.researchreview.exceptions.InternalErrorException
import com.example.researchreview.exceptions.SendEmailFailedException
import com.example.researchreview.services.EmailService
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.Base64

@Service
@ConditionalOnProperty(name = ["email.provider"], havingValue = "resend")
class ResendEmailServiceImpl(
    private val objectMapper: ObjectMapper
) : EmailService {

    @Value("\${resend.api-key:}")
    private val apiKey: String = ""

    @Value("\${resend.from-email:}")
    private val fromEmail: String = ""

    private val httpClient = HttpClient.newBuilder().build()

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class ResendAttachment(
        val filename: String,
        val content: String
    )

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private data class ResendPayload(
        val from: String,
        val to: List<String>,
        val cc: List<String>?,
        val bcc: List<String>?,
        val subject: String,
        val html: String,
        val attachments: List<ResendAttachment>?
    )

    override fun sendEmail(
        to: List<String>,
        cc: List<String>?,
        bcc: List<String>?,
        subject: String,
        message: String,
        template: String,
        attachment: Map<String, ByteArray>?
    ) {
        if (apiKey.isBlank() || fromEmail.isBlank()) {
            println("Resend API key or From Email is missing in configuration.")
            throw SendEmailFailedException()
        }

        val attachmentsList = attachment?.map { (filename, bytes) ->
            ResendAttachment(
                filename = filename,
                content = Base64.getEncoder().encodeToString(bytes)
            )
        }

        val payload = ResendPayload(
            from = fromEmail,
            to = to,
            cc = cc?.takeIf { it.isNotEmpty() },
            bcc = bcc?.takeIf { it.isNotEmpty() },
            subject = subject,
            html = message,
            attachments = attachmentsList?.takeIf { it.isNotEmpty() }
        )

        val jsonBody = objectMapper.writeValueAsString(payload)

        val request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.resend.com/emails"))
            .header("Authorization", "Bearer ${apiKey}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build()

        try {
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            if (response.statusCode() !in 200..299) {
                println("Resend API failed with status ${response.statusCode()}: ${response.body()}")
                throw SendEmailFailedException()
            }
        } catch (e: SendEmailFailedException) {
            throw e
        } catch (e: Exception) {
            e.printStackTrace()
            throw InternalErrorException()
        }
    }
}
