package com.example.researchreview.dtos

data class AttachmentDownloadDto(
    val bytes: ByteArray,
    val fileName: String,
    val mimeType: String
)
