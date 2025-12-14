package com.example.researchreview.dtos

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import java.time.LocalDateTime

data class AttachmentDto(
    val id: String,
    val articleId: String,
    val version: Int,
    val fileName: String,
    val fileSize: Long,
    val mimeType: String,
    val checksum: String?,
    val kind: AttachmentKind,
    val status: AttachmentStatus,
    val createdAt: LocalDateTime?,
    val createdBy: String?
)
