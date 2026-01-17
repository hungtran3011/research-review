package com.example.researchreview.services.impl

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import com.example.researchreview.repositories.AttachmentRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.ArticlePdfService
import com.example.researchreview.services.S3Service
import jakarta.persistence.EntityNotFoundException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ArticlePdfServiceImpl(
    private val articleAccessGuard: ArticleAccessGuard,
    private val attachmentRepository: AttachmentRepository,
    private val s3Service: S3Service,
    @Value("\${aws.s3.bucket-name:research-review-attachments}") private val bucketName: String,
) : ArticlePdfService {

    @Transactional(readOnly = true)
    override fun getArticlePdf(articleId: String, version: Int?): ResponseEntity<ByteArray> {
        // Access control
        articleAccessGuard.fetchAccessibleArticle(articleId)

        val candidates = attachmentRepository.findAllByArticleIdAndDeletedFalse(articleId)
            .asSequence()
            .filter { it.status == AttachmentStatus.AVAILABLE }
            .filter { it.kind == AttachmentKind.SUBMISSION || it.kind == AttachmentKind.REVISION }
            .toList()

        if (candidates.isEmpty()) {
            throw EntityNotFoundException("No PDF attachment found")
        }

        val attachment = if (version != null) {
            candidates
                .filter { it.version == version }
                .maxWithOrNull(compareBy({ it.createdAt }, { it.id }))
                ?: throw EntityNotFoundException("No PDF found for version $version")
        } else {
            // Default: prefer latest REVISION if any exist; otherwise latest SUBMISSION.
            val latestRevision = candidates
                .filter { it.kind == AttachmentKind.REVISION }
                .maxWithOrNull(compareBy<com.example.researchreview.entities.Attachment>({ it.version }, { it.createdAt }))
            latestRevision ?: candidates
                .filter { it.kind == AttachmentKind.SUBMISSION }
                .maxWithOrNull(compareBy<com.example.researchreview.entities.Attachment>({ it.version }, { it.createdAt }))
                ?: throw EntityNotFoundException("No submission file found")
        }

        // Viewer expects a PDF
        val mimeType = attachment.mimeType.takeIf { !it.isNullOrBlank() } ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
        if (!mimeType.lowercase().contains("pdf") && !attachment.fileName.lowercase().endsWith(".pdf")) {
            throw EntityNotFoundException("Submission file is not a PDF")
        }

        // Load complete file from S3 into memory
        val fileBytes = s3Service.download(bucketName, attachment.s3Key)
            ?: throw EntityNotFoundException("File not found in S3")
        
        val headers = HttpHeaders().apply {
            contentType = MediaType.parseMediaType(mimeType)
            set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${attachment.fileName}\"")
            contentLength = fileBytes.size.toLong()
        }

        return ResponseEntity.ok().headers(headers).body(fileBytes)
    }
}
