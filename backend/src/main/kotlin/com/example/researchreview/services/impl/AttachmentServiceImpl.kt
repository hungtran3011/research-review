package com.example.researchreview.services.impl

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.Role
import com.example.researchreview.dtos.AttachmentDownloadDto
import com.example.researchreview.dtos.AttachmentDto
import com.example.researchreview.dtos.AttachmentFinalizeRequestDto
import com.example.researchreview.dtos.AttachmentUploadRequestDto
import com.example.researchreview.dtos.AttachmentUploadResponseDto
import com.example.researchreview.entities.Attachment
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.AttachmentRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.AttachmentService
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.S3Service
import jakarta.persistence.EntityNotFoundException
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.UUID

@Service
class AttachmentServiceImpl(
    private val attachmentRepository: AttachmentRepository,
    private val articleAccessGuard: ArticleAccessGuard,
    private val currentUserService: CurrentUserService,
    private val s3Service: S3Service,
    private val notificationService: NotificationService,
    private val articleAuthorRepository: ArticleAuthorRepository,
    private val editorRepository: EditorRepository,
    @Value("\${aws.s3.bucket-name:research-review-attachments}") private val bucketName: String,
    @Value("\${attachments.upload-expiration-seconds:900}") private val uploadExpirationSeconds: Long
) : AttachmentService {

    @Transactional
    override fun requestUploadSlot(articleId: String, request: AttachmentUploadRequestDto): AttachmentUploadResponseDto {
        val article = articleAccessGuard.fetchAccessibleArticle(articleId)
        val requester = currentUserService.requireUser()
        val key = buildObjectKey(articleId, request.fileName)
        val attachment = Attachment().apply {
            this.article = article
            this.uploadedBy = requester
            this.version = request.version
            this.fileName = request.fileName
            this.fileSize = request.fileSize
            this.mimeType = request.mimeType
            this.kind = request.kind
            this.s3Key = key
            this.status = com.example.researchreview.constants.AttachmentStatus.PENDING_UPLOAD
        }
        val saved = attachmentRepository.save(attachment)
        val uploadUrl = s3Service.createUploadUrl(bucketName, key, uploadExpirationSeconds)
        return AttachmentUploadResponseDto(
            attachmentId = saved.id,
            uploadUrl = uploadUrl,
            s3Key = key,
            expiresAt = Instant.now().plusSeconds(uploadExpirationSeconds)
        )
    }

    @Transactional
    override fun uploadAttachment(
        articleId: String,
        file: MultipartFile,
        version: Int,
        kind: AttachmentKind
    ): AttachmentDto {
        val article = articleAccessGuard.fetchAccessibleArticle(articleId)
        val requester = currentUserService.requireUser()
        val fileName = file.originalFilename?.takeIf { it.isNotBlank() } ?: file.name
        val mimeType = file.contentType ?: "application/octet-stream"
        val key = buildObjectKey(articleId, fileName)
        val attachment = Attachment().apply {
            this.article = article
            this.uploadedBy = requester
            this.version = version
            this.fileName = fileName
            this.fileSize = file.size
            this.mimeType = mimeType
            this.kind = kind
            this.s3Key = key
            this.status = com.example.researchreview.constants.AttachmentStatus.PENDING_UPLOAD
        }
        // Persist early to obtain attachment id for logging/context
        val saved = attachmentRepository.save(attachment)

        // Pass context so S3Service can log attachment/article IDs when uploading
        val context = mapOf("attachmentId" to saved.id, "articleId" to articleId)

        s3Service.upload(bucketName, key, file, context)
        saved.status = com.example.researchreview.constants.AttachmentStatus.AVAILABLE
        val finalSaved = attachmentRepository.save(saved)
        notifyUpload(finalSaved)
        return finalSaved.toDto()
    }

    @Transactional
    override fun finalizeUpload(attachmentId: String, request: AttachmentFinalizeRequestDto): AttachmentDto {
        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { EntityNotFoundException("Attachment not found") }
        val user = currentUserService.requireUser()
        ensureAttachmentPermission(user.id, attachment)
        attachment.checksum = request.checksum
        attachment.status = com.example.researchreview.constants.AttachmentStatus.AVAILABLE
        val saved = attachmentRepository.save(attachment)
        notifyUpload(saved)
        return saved.toDto()
    }

    @Transactional(readOnly = true)
    override fun listArticleAttachments(articleId: String, version: Int?): List<AttachmentDto> {
        articleAccessGuard.fetchAccessibleArticle(articleId)
        val attachments = if (version != null) {
            attachmentRepository.findAllByArticleIdAndVersionAndDeletedFalse(articleId, version)
        } else {
            attachmentRepository.findAllByArticleIdAndDeletedFalse(articleId)
        }
        return attachments.filter { it.status != com.example.researchreview.constants.AttachmentStatus.DELETED }.map { it.toDto() }
    }

    @Transactional
    override fun deleteAttachment(attachmentId: String) {
        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { EntityNotFoundException("Attachment not found") }
        val user = currentUserService.requireUser()
        ensureAttachmentPermission(user.id, attachment)
        attachment.status = com.example.researchreview.constants.AttachmentStatus.DELETED
        attachmentRepository.save(attachment)
    }

    @Transactional(readOnly = true)
    override fun downloadAttachment(attachmentId: String): AttachmentDownloadDto {
        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { EntityNotFoundException("Attachment not found") }
        articleAccessGuard.fetchAccessibleArticle(attachment.article.id)
        val bytes = s3Service.download(bucketName, attachment.s3Key)
            ?: throw IllegalStateException("Attachment content not found in storage")
        return AttachmentDownloadDto(
            bytes = bytes,
            fileName = attachment.fileName,
            mimeType = attachment.mimeType
        )
    }

    @Transactional(readOnly = true)
    override fun downloadUrl(attachmentId: String, expirationSeconds: Long): String {
        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { EntityNotFoundException("Attachment not found") }
        articleAccessGuard.fetchAccessibleArticle(attachment.article.id)
        return s3Service.createDownloadUrl(bucketName, attachment.s3Key, expirationSeconds)
    }

    private fun Attachment.toDto(): AttachmentDto = AttachmentDto(
        id = this.id,
        articleId = this.article.id,
        version = this.version,
        fileName = this.fileName,
        fileSize = this.fileSize,
        mimeType = this.mimeType,
        checksum = this.checksum,
        kind = this.kind,
        status = this.status,
        createdAt = this.createdAt,
        createdBy = this.createdBy
    )

    private fun buildObjectKey(articleId: String, fileName: String): String {
        val safeName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
        return "attachments/$articleId/${UUID.randomUUID()}-$safeName"
    }

    private fun ensureAttachmentPermission(userId: String, attachment: Attachment) {
        val user = currentUserService.currentUser()
            ?: throw AccessDeniedException("User not found")
        when {
            user.hasRole(Role.ADMIN) -> return
            user.hasRole(Role.EDITOR) -> {
                val trackId = user.track?.id ?: throw AccessDeniedException("Editor track missing")
                if (attachment.article.track.id != trackId) {
                    throw AccessDeniedException("Editor cannot modify this attachment")
                }
            }
            else -> {
                val ownerId = attachment.uploadedBy?.id
                if (ownerId != userId) {
                    throw AccessDeniedException("Cannot modify attachment")
                }
            }
        }
    }

    private fun notifyUpload(attachment: Attachment) {
        val uploaderId = attachment.uploadedBy?.id
        val article = attachment.article
        val authorIds = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .mapNotNull { it.author.user?.id }
        val editorIds = editorRepository.findAllByTrackIdAndDeletedFalse(article.track.id)
            .mapNotNull { it.user.id }
        val recipients = (authorIds + editorIds).filter { !it.isNullOrBlank() && it != uploaderId }.toSet()
        if (recipients.isEmpty()) {
            return
        }
        notificationService.notifyUsers(
            recipients,
            NotificationType.FILE_UPLOADED,
            payload = mapOf(
                "articleId" to article.id,
                "fileName" to attachment.fileName,
                "kind" to attachment.kind.name
            ),
            contextId = attachment.id,
            contextType = "ATTACHMENT"
        )
    }

    @Transactional
    override fun saveAttachment(articleId: String, file: MultipartFile, kind: String): AttachmentDto {
        val kindEnum = try {
            AttachmentKind.valueOf(kind)
        } catch (ex: IllegalArgumentException) {
            AttachmentKind.SUBMISSION
        }
        return uploadAttachment(articleId, file, version = 1, kind = kindEnum)
    }
}
