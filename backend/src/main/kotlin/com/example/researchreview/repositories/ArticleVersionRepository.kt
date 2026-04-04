package com.example.researchreview.repositories

import com.example.researchreview.entities.ArticleVersion
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface ArticleVersionRepository : JpaRepository<ArticleVersion, String> {
    fun findAllByArticleIdAndDeletedFalseOrderByVersionNumberDesc(articleId: String): List<ArticleVersion>

    fun findByArticleIdAndVersionNumberAndDeletedFalse(
        articleId: String,
        versionNumber: Int
    ): Optional<ArticleVersion>
}