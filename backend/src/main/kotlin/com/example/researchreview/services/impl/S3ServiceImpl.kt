package com.example.researchreview.services.impl

import com.example.researchreview.services.S3Service
import io.awspring.cloud.s3.ObjectMetadata
import io.awspring.cloud.s3.S3Template
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.time.Duration

@Service
class S3ServiceImpl @Autowired constructor(
    private val s3Template: S3Template
) : S3Service {
    override fun upload(
        bucketName: String,
        key: String,
        file: MultipartFile
    ) {
        file.inputStream.use { inputStream ->
            val metadata = ObjectMetadata.builder()
                .contentType(file.contentType)
                .contentLength(file.size)
                .build()
            s3Template.upload(bucketName, key, inputStream, metadata)
        }
    }

    override fun download(bucketName: String, key: String): ByteArray? {
        val resource = s3Template.download(bucketName, key)
        return resource.inputStream.readBytes()
    }

    override fun delete(bucketName: String, key: String) {
        s3Template.deleteObject(bucketName, key)
    }

    override fun createUploadUrl(bucketName: String, key: String, expirationSeconds: Long): String {
        val url = s3Template.createSignedPutURL(bucketName, key, Duration.ofSeconds(expirationSeconds))
        return url.toString()
    }

    override fun createDownloadUrl(bucketName: String, key: String, expirationSeconds: Long): String {
        val url = s3Template.createSignedGetURL(bucketName, key, Duration.ofSeconds(expirationSeconds))
        return url.toString()
    }
}