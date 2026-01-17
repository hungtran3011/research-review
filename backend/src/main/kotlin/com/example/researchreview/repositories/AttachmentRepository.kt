package com.example.researchreview.repositories

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import com.example.researchreview.entities.Attachment
import org.springframework.data.jpa.repository.JpaRepository

interface AttachmentRepository : JpaRepository<Attachment, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<Attachment>
    fun findAllByArticleIdAndVersionAndDeletedFalse(articleId: String, version: Int): List<Attachment>

    fun findTopByArticleIdAndKindAndStatusAndDeletedFalseOrderByCreatedAtDesc(
        articleId: String,
        kind: AttachmentKind,
        status: AttachmentStatus
    ): Attachment?
}
