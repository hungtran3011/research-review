package com.example.researchreview.services

import com.example.researchreview.dtos.ArticleVersionCreateRequestDto
import com.example.researchreview.dtos.ArticleVersionDto
import com.example.researchreview.dtos.VersionSupplementAttachRequestDto
import com.example.researchreview.dtos.VersionSupplementDto

interface ArticleVersionService {
    fun createVersion(articleId: String, request: ArticleVersionCreateRequestDto): ArticleVersionDto
    fun listVersions(articleId: String): List<ArticleVersionDto>
    fun attachSupplement(articleId: String, version: Int, request: VersionSupplementAttachRequestDto): ArticleVersionDto
    fun listSupplements(articleId: String, version: Int): List<VersionSupplementDto>
    fun mainDownloadUrl(articleId: String, version: Int, expirationSeconds: Long = 900): String
    fun supplementDownloadUrl(articleId: String, version: Int, attachmentId: String, expirationSeconds: Long = 900): String
}
