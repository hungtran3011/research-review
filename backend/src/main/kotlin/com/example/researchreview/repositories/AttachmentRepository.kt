package com.example.researchreview.repositories

import com.example.researchreview.entities.Attachment
import org.springframework.data.jpa.repository.JpaRepository

interface AttachmentRepository : JpaRepository<Attachment, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<Attachment>
    fun findAllByArticleIdAndVersionAndDeletedFalse(articleId: String, version: Int): List<Attachment>
}
