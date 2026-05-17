package com.example.researchreview.controllers

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.AttachmentDto
import com.example.researchreview.dtos.AttachmentFinalizeRequestDto
import com.example.researchreview.dtos.AttachmentUploadRequestDto
import com.example.researchreview.dtos.AttachmentUploadResponseDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.services.AttachmentService
import jakarta.validation.Valid
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("isAuthenticated()")
class AttachmentController(
    private val attachmentService: AttachmentService
) {

    @PostMapping("/articles/{articleId}/attachments/upload-slot")
    fun requestUploadSlot(
        @PathVariable articleId: String,
        @Valid @RequestBody request: AttachmentUploadRequestDto
    ): ResponseEntity<BaseResponseDto<AttachmentUploadResponseDto>> {
        return try {
            val response = attachmentService.requestUploadSlot(articleId, request)
            ResponseEntity.status(HttpStatus.CREATED).body(
                BaseResponseDto(
                    code = 201,
                    message = "Upload slot created",
                    data = response
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }

    @PostMapping("/articles/{articleId}/attachments", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadAttachment(
        @PathVariable articleId: String,
        @RequestPart("file") file: MultipartFile,
        @RequestParam(required = false, defaultValue = "SUBMISSION") kind: AttachmentKind,
        @RequestParam(required = false, defaultValue = "1") version: Int
    ): ResponseEntity<BaseResponseDto<AttachmentDto>> {
        return try {
            val attachment = attachmentService.uploadAttachment(articleId, file, version, kind)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Attachment uploaded",
                    data = attachment
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }

    @PostMapping("/attachments/{attachmentId}/finalize")
    fun finalizeUpload(
        @PathVariable attachmentId: String,
        @Valid @RequestBody request: AttachmentFinalizeRequestDto
    ): ResponseEntity<BaseResponseDto<AttachmentDto>> {
        return try {
            val attachment = attachmentService.finalizeUpload(attachmentId, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Attachment finalized",
                    data = attachment
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }

    @GetMapping("/articles/{articleId}/attachments")
    fun listAttachments(
        @PathVariable articleId: String,
        @RequestParam(required = false) version: Int?
    ): ResponseEntity<BaseResponseDto<List<AttachmentDto>>> {
        val attachments = attachmentService.listArticleAttachments(articleId, version)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "Attachments retrieved",
                data = attachments
            )
        )
    }

    @DeleteMapping("/attachments/{attachmentId}")
    fun deleteAttachment(@PathVariable attachmentId: String): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            attachmentService.deleteAttachment(attachmentId)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Attachment deleted"
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }

    @GetMapping("/attachments/{attachmentId}/download")
    fun downloadAttachment(@PathVariable attachmentId: String): ResponseEntity<Any> {
        try {
            val download = attachmentService.downloadAttachment(attachmentId)
            val resource = ByteArrayResource(download.bytes)
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${download.fileName}\"")
                .contentType(MediaType.parseMediaType(download.mimeType))
                .contentLength(download.bytes.size.toLong())
                .body(resource)
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto<Unit>(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null
                )
            )
        }
    }

    @GetMapping("/attachments/{attachmentId}/download-url")
    fun downloadUrl(@PathVariable attachmentId: String): ResponseEntity<BaseResponseDto<String>> {
        try {
            val url = attachmentService.downloadUrl(attachmentId)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Download URL generated",
                    data = url
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }
}
