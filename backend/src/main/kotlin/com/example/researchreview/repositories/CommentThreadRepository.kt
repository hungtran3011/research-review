package com.example.researchreview.repositories

import com.example.researchreview.entities.CommentThread
import org.springframework.data.jpa.repository.JpaRepository

interface CommentThreadRepository: JpaRepository<CommentThread, String> {
    fun findAllByArticleId(articleId: String): List<CommentThread>
}
