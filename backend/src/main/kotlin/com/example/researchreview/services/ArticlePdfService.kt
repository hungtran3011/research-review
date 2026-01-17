package com.example.researchreview.services

import org.springframework.http.ResponseEntity

interface ArticlePdfService {
    fun getArticlePdf(articleId: String, version: Int? = null): ResponseEntity<ByteArray>
}
