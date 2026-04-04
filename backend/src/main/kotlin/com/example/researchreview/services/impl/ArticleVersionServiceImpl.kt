package com.example.researchreview.services.impl

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import com.example.researchreview.dtos.ArticleVersionCreateRequestDto
import com.example.researchreview.dtos.ArticleVersionDto
import com.example.researchreview.dtos.VersionSupplementAttachRequestDto
import com.example.researchreview.dtos.VersionSupplementDto
import com.example.researchreview.entities.ArticleVersion
import com.example.researchreview.entities.Attachment
import com.example.researchreview.repositories.ArticleVersionRepository
import com.example.researchreview.repositories.AttachmentRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.ArticleVersionService
import com.example.researchreview.services.AttachmentService
import com.example.researchreview.services.CurrentUserService
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ArticleVersionServiceImpl(
    private val articleVersionRepository: ArticleVersionRepository,
    private val attachmentRepository: AttachmentRepository,
    private val articleAccessGuard: ArticleAccessGuard,
    private val currentUserService: CurrentUserService,
    private val attachmentService: AttachmentService
) : ArticleVersionService {

    @Transactional
    override fun createVersion(articleId: String, request: ArticleVersionCreateRequestDto): ArticleVersionDto {
        val article = articleAccessGuard.fetchAccessibleArticle(articleId)

        val existing = articleVersionRepository.findByArticleIdAndVersionNumberAndDeletedFalse(articleId, request.versionNumber)
        if (existing.isPresent) {
            throw IllegalStateException("articleVersion.alreadyExists")
        }

        val requester = currentUserService.requireUser()
        val articleVersion = ArticleVersion().apply {
            this.article = article
            this.versionNumber = request.versionNumber
            this.submittedBy = requester
            this.submittedAt = LocalDateTime.now()
        }

        val savedVersion = articleVersionRepository.save(articleVersion)

        val mainAttachment = request.mainAttachmentId?.let { attachmentId ->
            val attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow { EntityNotFoundException("attachment.notFound") }

            if (attachment.article.id != articleId) {
                throw IllegalStateException("articleVersion.mainAttachmentArticleMismatch")
            }
            if (attachment.version != request.versionNumber) {
                throw IllegalStateException("articleVersion.mainAttachmentVersionMismatch")
            }
            if (attachment.kind == AttachmentKind.SUPPLEMENTAL) {
                throw IllegalStateException("articleVersion.mainAttachmentInvalidKind")
            }

            savedVersion.mainAttachment = attachment
            attachment.articleVersion = savedVersion
            attachmentRepository.save(attachment)
        }

        val finalVersion = articleVersionRepository.save(savedVersion)
        val versionAttachments = attachmentRepository.findAllByArticleVersionIdAndDeletedFalseOrderByCreatedAtDesc(finalVersion.id)
        return finalVersion.toDto(versionAttachments, mainAttachment)
    }

    @Transactional(readOnly = true)
    override fun listVersions(articleId: String): List<ArticleVersionDto> {
        articleAccessGuard.fetchAccessibleArticle(articleId)
        val versions = articleVersionRepository.findAllByArticleIdAndDeletedFalseOrderByVersionNumberDesc(articleId)
        return versions.map { version ->
            val attachments = attachmentRepository.findAllByArticleVersionIdAndDeletedFalseOrderByCreatedAtDesc(version.id)
            version.toDto(attachments)
        }
    }

    @Transactional
    override fun attachSupplement(
        articleId: String,
        version: Int,
        request: VersionSupplementAttachRequestDto
    ): ArticleVersionDto {
        val articleVersion = fetchArticleVersion(articleId, version)
        val attachment = attachmentRepository.findById(request.attachmentId)
            .orElseThrow { EntityNotFoundException("attachment.notFound") }

        if (attachment.deleted) {
            throw EntityNotFoundException("attachment.notFound")
        }
        if (attachment.article.id != articleId) {
            throw IllegalStateException("articleVersion.attachmentArticleMismatch")
        }
        if (attachment.version != version) {
            throw IllegalStateException("articleVersion.attachmentVersionMismatch")
        }
        if (attachment.kind != AttachmentKind.SUPPLEMENTAL) {
            throw IllegalStateException("articleVersion.supplementMustBeSupplemental")
        }
        if (attachment.status != AttachmentStatus.AVAILABLE) {
            throw IllegalStateException("articleVersion.attachmentNotAvailable")
        }

        attachment.articleVersion = articleVersion
        attachmentRepository.save(attachment)

        val attachments = attachmentRepository.findAllByArticleVersionIdAndDeletedFalseOrderByCreatedAtDesc(articleVersion.id)
        return articleVersion.toDto(attachments)
    }

    @Transactional(readOnly = true)
    override fun listSupplements(articleId: String, version: Int): List<VersionSupplementDto> {
        val articleVersion = fetchArticleVersion(articleId, version)
        val attachments = attachmentRepository.findAllByArticleVersionIdAndDeletedFalseOrderByCreatedAtDesc(articleVersion.id)
        return attachments
            .filter { it.status == AttachmentStatus.AVAILABLE && it.kind == AttachmentKind.SUPPLEMENTAL }
            .map { it.toVersionSupplementDto() }
    }

    @Transactional(readOnly = true)
    override fun mainDownloadUrl(articleId: String, version: Int, expirationSeconds: Long): String {
        val articleVersion = fetchArticleVersion(articleId, version)
        val attachments = attachmentRepository.findAllByArticleVersionIdAndDeletedFalseOrderByCreatedAtDesc(articleVersion.id)
            .filter { it.status == AttachmentStatus.AVAILABLE }

        val resolvedMain = articleVersion.mainAttachment
            ?: attachments.firstOrNull { it.kind == AttachmentKind.REVISION }
            ?: attachments.firstOrNull { it.kind == AttachmentKind.SUBMISSION }
            ?: throw EntityNotFoundException("articleVersion.mainAttachmentNotFound")

        return attachmentService.downloadUrl(resolvedMain.id, expirationSeconds)
    }

    @Transactional(readOnly = true)
    override fun supplementDownloadUrl(
        articleId: String,
        version: Int,
        attachmentId: String,
        expirationSeconds: Long
    ): String {
        val articleVersion = fetchArticleVersion(articleId, version)
        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { EntityNotFoundException("attachment.notFound") }

        if (attachment.deleted) {
            throw EntityNotFoundException("attachment.notFound")
        }
        if (attachment.articleVersion?.id != articleVersion.id) {
            throw IllegalStateException("articleVersion.supplementNotInVersion")
        }
        if (attachment.kind != AttachmentKind.SUPPLEMENTAL) {
            throw IllegalStateException("articleVersion.supplementMustBeSupplemental")
        }
        if (attachment.status != AttachmentStatus.AVAILABLE) {
            throw IllegalStateException("articleVersion.attachmentNotAvailable")
        }

        return attachmentService.downloadUrl(attachment.id, expirationSeconds)
    }

    private fun fetchArticleVersion(articleId: String, version: Int): ArticleVersion {
        articleAccessGuard.fetchAccessibleArticle(articleId)
        return articleVersionRepository.findByArticleIdAndVersionNumberAndDeletedFalse(articleId, version)
            .orElseThrow { EntityNotFoundException("articleVersion.notFound") }
    }

    private fun ArticleVersion.toDto(
        attachments: List<Attachment>,
        preferredMain: Attachment? = null
    ): ArticleVersionDto {
        val availableAttachments = attachments.filter { it.status == AttachmentStatus.AVAILABLE }

        val resolvedMain = preferredMain
            ?: this.mainAttachment
            ?: availableAttachments.firstOrNull { it.kind == AttachmentKind.REVISION }
            ?: availableAttachments.firstOrNull { it.kind == AttachmentKind.SUBMISSION }

        val supplements = availableAttachments
            .filter { it.kind == AttachmentKind.SUPPLEMENTAL }
            .map { it.toVersionSupplementDto() }

        return ArticleVersionDto(
            id = this.id,
            articleId = this.article.id,
            versionNumber = this.versionNumber,
            submittedAt = this.submittedAt,
            submittedBy = this.submittedBy?.id,
            mainAttachment = resolvedMain?.toVersionSupplementDto(),
            supplements = supplements
        )
    }

    private fun Attachment.toVersionSupplementDto(): VersionSupplementDto = VersionSupplementDto(
        id = this.id,
        fileName = this.fileName,
        fileSize = this.fileSize,
        mimeType = this.mimeType,
        kind = this.kind,
        status = this.status,
        createdAt = this.createdAt,
        createdBy = this.createdBy
    )
}
