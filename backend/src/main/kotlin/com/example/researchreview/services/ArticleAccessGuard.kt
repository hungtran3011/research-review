package com.example.researchreview.services

import com.example.researchreview.entities.Article
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ArticleAccessGuard {
    fun listAccessibleArticles(pageable: Pageable): Page<Article>
    fun fetchAccessibleArticle(articleId: String): Article
}
