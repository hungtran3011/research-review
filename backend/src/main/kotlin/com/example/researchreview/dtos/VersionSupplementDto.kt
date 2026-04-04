package com.example.researchreview.dtos

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import java.time.LocalDateTime

data class VersionSupplementDto(
    val id: String,
    val fileName: String,
    val fileSize: Long,
    val mimeType: String,
    val kind: AttachmentKind,
    val status: AttachmentStatus,
    val createdAt: LocalDateTime,
    val createdBy: String
)
