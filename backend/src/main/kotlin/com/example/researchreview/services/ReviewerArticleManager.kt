package com.example.researchreview.services

import com.example.researchreview.entities.ReviewerArticle

interface ReviewerArticleManager {
    fun reviewerLabels(articleId: String): Map<String, String>
    fun ensureDisplayIndexFor(relation: ReviewerArticle)
}
