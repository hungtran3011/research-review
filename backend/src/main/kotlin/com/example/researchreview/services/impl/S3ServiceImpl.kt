package com.example.researchreview.services.impl

import com.example.researchreview.services.S3ObjectHead
import com.example.researchreview.services.S3ObjectStream
import com.example.researchreview.services.S3Service
import io.awspring.cloud.s3.ObjectMetadata
import io.awspring.cloud.s3.S3Template
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.HeadObjectRequest
import java.io.ByteArrayInputStream
import java.time.Duration
import kotlin.math.pow

@Service
class S3ServiceImpl @Autowired constructor(
    private val s3Template: S3Template,
    private val s3Client: S3Client
) : S3Service {

    private val log = LoggerFactory.getLogger(S3ServiceImpl::class.java)

    override fun upload(
        bucketName: String,
        key: String,
        file: MultipartFile,
        context: Map<String, String>?
    ) {
        uploadWithRetries(bucketName, key, file, context)
    }

    private fun uploadWithRetries(
        bucketName: String,
        key: String,
        file: MultipartFile,
        context: Map<String, String>?,
        maxAttempts: Int = 3,
        baseBackoffMs: Long = 500L
    ) {
        val cleanKey = key.trimStart('/')

        // Read file into memory so we can retry safely. For large files consider streaming to temp file or using multipart upload.
        val bytes: ByteArray = try {
            file.inputStream.use { it.readBytes() }
        } catch (ex: Exception) {
            throw RuntimeException("Failed to read upload stream for key '$cleanKey'", ex)
        }

        val metadata = ObjectMetadata.builder()
            .contentType(file.contentType)
            .contentLength(bytes.size.toLong())
            .build()

        var attempt = 0
        var lastEx: Exception? = null
        while (attempt < maxAttempts) {
            attempt++
            try {
                val attemptStream = ByteArrayInputStream(bytes)
                log.info(
                    "S3 upload attempt {}/{} for bucket={}, key={}, attachmentId={}, articleId={}",
                    attempt,
                    maxAttempts,
                    bucketName,
                    cleanKey,
                    context?.get("attachmentId"),
                    context?.get("articleId")
                )
                s3Template.upload(bucketName, cleanKey, attemptStream, metadata)
                log.info(
                    "S3 upload succeeded on attempt {}/{} for bucket={}, key={}, attachmentId={}, articleId={}",
                    attempt,
                    maxAttempts,
                    bucketName,
                    cleanKey,
                    context?.get("attachmentId"),
                    context?.get("articleId")
                )
                return
            } catch (ex: Exception) {
                lastEx = ex
                log.warn(
                    "S3 upload attempt {}/{} failed for bucket={}, key={}, attachmentId={}, articleId={}: {}",
                    attempt,
                    maxAttempts,
                    bucketName,
                    cleanKey,
                    context?.get("attachmentId"),
                    context?.get("articleId"),
                    ex.message
                )
                if (attempt >= maxAttempts) break
                val backoff = (baseBackoffMs * 2.0.pow((attempt - 1).toDouble())).toLong()
                try {
                    Thread.sleep(backoff)
                } catch (ie: InterruptedException) {
                    Thread.currentThread().interrupt()
                    throw RuntimeException("Upload interrupted while waiting to retry s3://$bucketName/$cleanKey", ie)
                }
            }
        }

        // All attempts failed
        log.error(
            "S3 upload permanently failed after {} attempts for bucket={}, key={}, attachmentId={}, articleId={}",
            maxAttempts,
            bucketName,
            cleanKey,
            context?.get("attachmentId"),
            context?.get("articleId")
        )
        throw RuntimeException("Failed to upload object with a key '$cleanKey' to bucket '$bucketName'", lastEx)
    }

    override fun download(bucketName: String, key: String): ByteArray? {
        val cleanKey = key.trimStart('/')
        val resource = s3Template.download(bucketName, cleanKey)
        return resource.inputStream.readBytes()
    }

    override fun head(bucketName: String, key: String): S3ObjectHead {
        val cleanKey = key.trimStart('/')
        val resp = s3Client.headObject(
            HeadObjectRequest.builder()
                .bucket(bucketName)
                .key(cleanKey)
                .build()
        )
        return S3ObjectHead(
            contentLength = resp.contentLength(),
            contentType = resp.contentType()
        )
    }

    override fun openStream(
        bucketName: String,
        key: String,
        rangeStart: Long?,
        rangeEndInclusive: Long?
    ): S3ObjectStream {
        val cleanKey = key.trimStart('/')
        val requestBuilder = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(cleanKey)

        if (rangeStart != null || rangeEndInclusive != null) {
            val range = when {
                rangeStart != null && rangeEndInclusive != null -> "bytes=$rangeStart-$rangeEndInclusive"
                rangeStart != null -> "bytes=$rangeStart-"
                else -> throw IllegalArgumentException("rangeEndInclusive without rangeStart is not supported")
            }
            requestBuilder.range(range)
        }

        val stream = s3Client.getObject(requestBuilder.build())
        val resp = stream.response()
        return S3ObjectStream(
            inputStream = stream,
            contentLength = resp.contentLength(),
            contentType = resp.contentType()
        )
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