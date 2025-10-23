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
}