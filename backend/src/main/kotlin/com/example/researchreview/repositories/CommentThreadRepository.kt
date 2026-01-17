package com.example.researchreview.repositories

import com.example.researchreview.entities.CommentThread
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface CommentThreadRepository: JpaRepository<CommentThread, String> {
    @Query("SELECT DISTINCT ct FROM CommentThread ct " +
           "LEFT JOIN FETCH ct.comments " +
           "LEFT JOIN FETCH ct.reviewer r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE ct.article.id = :articleId " +
           "AND ct.deleted = false " +
           "ORDER BY ct.createdAt DESC")
    fun findAllByArticleId(articleId: String): List<CommentThread>
}
