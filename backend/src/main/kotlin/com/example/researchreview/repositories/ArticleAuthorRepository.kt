package com.example.researchreview.repositories

import com.example.researchreview.entities.ArticleAuthor
import org.springframework.data.jpa.repository.JpaRepository

interface ArticleAuthorRepository: JpaRepository<ArticleAuthor, String> {
    fun findAllByArticleIdAndDeletedFalse(articleId: String): List<ArticleAuthor>
}
