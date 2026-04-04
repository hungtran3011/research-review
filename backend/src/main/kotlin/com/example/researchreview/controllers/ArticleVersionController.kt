package com.example.researchreview.controllers

import com.example.researchreview.dtos.ArticleVersionCreateRequestDto
import com.example.researchreview.dtos.ArticleVersionDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.VersionSupplementAttachRequestDto
import com.example.researchreview.dtos.VersionSupplementDto
import com.example.researchreview.services.ArticleVersionService
import jakarta.persistence.EntityNotFoundException
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/articles/{articleId}/versions")
@PreAuthorize("isAuthenticated()")
class ArticleVersionController(
    private val articleVersionService: ArticleVersionService
) {

    @PostMapping
    fun createVersion(
        @PathVariable articleId: String,
        @Valid @RequestBody request: ArticleVersionCreateRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleVersionDto>> {
        return try {
            val created = articleVersionService.createVersion(articleId, request)
            ResponseEntity.status(HttpStatus.CREATED).body(
                BaseResponseDto(
                    code = 201,
                    message = "articleVersion.created",
                    data = created
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "articleVersion.articleOrAttachmentNotFound"
                )
            )
        } catch (ex: IllegalStateException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "articleVersion.invalidRequest"
                )
            )
        }
    }

    @GetMapping
    fun listVersions(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<List<ArticleVersionDto>>> {
        val versions = articleVersionService.listVersions(articleId)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "articleVersion.retrieved",
                data = versions
            )
        )
    }

    @PostMapping("/{version}/attachments")
    fun attachSupplement(
        @PathVariable articleId: String,
        @PathVariable version: Int,
        @Valid @RequestBody request: VersionSupplementAttachRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleVersionDto>> {
        return try {
            val updated = articleVersionService.attachSupplement(articleId, version, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "articleVersion.supplementAttached",
                    data = updated
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "articleVersion.articleOrAttachmentNotFound"
                )
            )
        } catch (ex: IllegalStateException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "articleVersion.invalidRequest"
                )
            )
        }
    }

    @GetMapping("/{version}/supplements")
    fun listSupplements(
        @PathVariable articleId: String,
        @PathVariable version: Int
    ): ResponseEntity<BaseResponseDto<List<VersionSupplementDto>>> {
        return try {
            val supplements = articleVersionService.listSupplements(articleId, version)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "articleVersion.supplementsRetrieved",
                    data = supplements
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "articleVersion.notFound"
                )
            )
        }
    }

    @GetMapping("/{version}/main/download-url")
    fun mainDownloadUrl(
        @PathVariable articleId: String,
        @PathVariable version: Int,
        @RequestParam(required = false, defaultValue = "900") expirationSeconds: Long
    ): ResponseEntity<BaseResponseDto<String>> {
        return try {
            val url = articleVersionService.mainDownloadUrl(articleId, version, expirationSeconds)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "articleVersion.mainDownloadUrlGenerated",
                    data = url
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "articleVersion.mainAttachmentNotFound"
                )
            )
        } catch (ex: IllegalStateException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "articleVersion.invalidRequest"
                )
            )
        }
    }

    @GetMapping("/{version}/supplements/{attachmentId}/download-url")
    fun supplementDownloadUrl(
        @PathVariable articleId: String,
        @PathVariable version: Int,
        @PathVariable attachmentId: String,
        @RequestParam(required = false, defaultValue = "900") expirationSeconds: Long
    ): ResponseEntity<BaseResponseDto<String>> {
        return try {
            val url = articleVersionService.supplementDownloadUrl(articleId, version, attachmentId, expirationSeconds)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "articleVersion.supplementDownloadUrlGenerated",
                    data = url
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "articleVersion.articleOrAttachmentNotFound"
                )
            )
        } catch (ex: IllegalStateException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "articleVersion.invalidRequest"
                )
            )
        }
    }
}
