package com.example.researchreview.services

import org.springframework.web.multipart.MultipartFile

interface S3Service {
    fun upload(
        bucketName: String,
        key: String,
        file: MultipartFile
    )

    fun download(bucketName: String, key: String): ByteArray?

    fun delete(bucketName: String, key: String)

    fun createUploadUrl(bucketName: String, key: String, expirationSeconds: Long = 900): String

    fun createDownloadUrl(bucketName: String, key: String, expirationSeconds: Long = 900): String
}