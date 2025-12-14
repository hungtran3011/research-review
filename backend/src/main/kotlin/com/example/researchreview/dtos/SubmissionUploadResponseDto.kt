package com.example.researchreview.dtos

data class SubmissionUploadResponseDto(
    val key: String,
    val url: String,
    val fileName: String,
    val mimeType: String,
    val size: Long
)
