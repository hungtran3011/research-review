package com.example.researchreview.controllers

import com.example.researchreview.services.ArticlePdfService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("isAuthenticated()")
class ArticlePdfController(
    private val articlePdfService: ArticlePdfService,
) {

    @GetMapping("/articles/{articleId}/pdf")
    fun getArticlePdf(
        @PathVariable articleId: String,
        @RequestParam(required = false) version: Int?,
    ): ResponseEntity<ByteArray> {
        return try {
            val serviceResponse = articlePdfService.getArticlePdf(articleId, version)
            val pdfBytes = serviceResponse.body ?: byteArrayOf()
            val contentDisposition = serviceResponse.headers.getFirst(HttpHeaders.CONTENT_DISPOSITION)
            val filename = contentDisposition?.let { extractFilename(it) } ?: "article-$articleId.pdf"

            ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .body(pdfBytes)
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(byteArrayOf())
        }
    }

    // Helper to extract filename from Content-Disposition header if present
    private fun extractFilename(contentDisposition: String): String? {
        val regex = Regex("filename\\*?=(?:UTF-8''|\"?)([^\";]+)")
        val match = regex.find(contentDisposition)
        val raw = match?.groups?.get(1)?.value
        return raw?.trim()?.trim('"')
    }
}
