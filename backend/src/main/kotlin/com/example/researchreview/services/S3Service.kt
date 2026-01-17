package com.example.researchreview.services

import java.io.InputStream
import org.springframework.web.multipart.MultipartFile

data class S3ObjectHead(
    val contentLength: Long,
    val contentType: String?
)

data class S3ObjectStream(
    val inputStream: InputStream,
    val contentLength: Long,
    val contentType: String?
)

interface S3Service {
    fun upload(
        bucketName: String,
        key: String,
        file: MultipartFile,
        context: Map<String, String>? = null
    )

    fun download(bucketName: String, key: String): ByteArray?

    fun head(bucketName: String, key: String): S3ObjectHead

    fun openStream(
        bucketName: String,
        key: String,
        rangeStart: Long? = null,
        rangeEndInclusive: Long? = null
    ): S3ObjectStream

    fun delete(bucketName: String, key: String)

    fun createUploadUrl(bucketName: String, key: String, expirationSeconds: Long = 900): String

    fun createDownloadUrl(bucketName: String, key: String, expirationSeconds: Long = 900): String
}