package com.example.researchreview.dtos

import java.time.Instant

data class AttachmentUploadResponseDto(
     val attachmentId: String,
     val uploadUrl: String,
     val s3Key: String,
     val expiresAt: Instant
 )
