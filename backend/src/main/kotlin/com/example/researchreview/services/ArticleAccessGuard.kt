package com.example.researchreview.services

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.entities.Article
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ArticleAccessGuard {
    fun listAccessibleArticles(pageable: Pageable): Page<Article>
    fun listAccessibleArticles(
        pageable: Pageable,
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Page<Article>

    fun countAccessibleArticles(
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Long

    fun fetchAccessibleArticle(articleId: String): Article
}
