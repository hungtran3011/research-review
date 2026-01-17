package com.example.researchreview.controllers

import com.example.researchreview.services.ArticlePdfService
import org.springframework.http.HttpHeaders
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
    ) = articlePdfService.getArticlePdf(articleId, version)
}
