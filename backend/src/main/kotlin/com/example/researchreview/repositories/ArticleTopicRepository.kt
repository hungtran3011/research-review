package com.example.researchreview.repositories

import com.example.researchreview.entities.ArticleTopic
import org.springframework.data.jpa.repository.JpaRepository

interface ArticleTopicRepository : JpaRepository<ArticleTopic, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<ArticleTopic>
}
