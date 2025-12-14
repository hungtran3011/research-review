package com.example.researchreview.services

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.dtos.AttachmentDownloadDto
import com.example.researchreview.dtos.AttachmentDto
import com.example.researchreview.dtos.AttachmentFinalizeRequestDto
import com.example.researchreview.dtos.AttachmentUploadRequestDto
import com.example.researchreview.dtos.AttachmentUploadResponseDto
import org.springframework.web.multipart.MultipartFile

interface AttachmentService {
    fun requestUploadSlot(articleId: String, request: AttachmentUploadRequestDto): AttachmentUploadResponseDto
    fun uploadAttachment(
        articleId: String,
        file: MultipartFile,
        version: Int = 1,
        kind: AttachmentKind = AttachmentKind.SUBMISSION
    ): AttachmentDto
    fun finalizeUpload(attachmentId: String, request: AttachmentFinalizeRequestDto): AttachmentDto
    fun listArticleAttachments(articleId: String, version: Int?): List<AttachmentDto>
    fun deleteAttachment(attachmentId: String)
    fun downloadAttachment(attachmentId: String): AttachmentDownloadDto
    fun downloadUrl(attachmentId: String, expirationSeconds: Long = 900): String
}
