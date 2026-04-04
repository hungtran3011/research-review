package com.example.researchreview.services.impl

import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.services.ReviewerArticleManager
import org.springframework.context.MessageSource
import org.springframework.stereotype.Service
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.transaction.annotation.Transactional

@Service
class ReviewerArticleManagerImpl(
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val messageSource: MessageSource,
) : ReviewerArticleManager {

    @Transactional(readOnly = true)
    override fun reviewerLabels(articleId: String): Map<String, String> {
        return reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(articleId)
            .filter { it.displayIndex > 0 }
            .associate { relation ->
                relation.reviewer.id to messageSource.getMessage(
                    "reviewer.label",
                    arrayOf(relation.displayIndex),
                    LocaleContextHolder.getLocale(),
                )
            }
    }

    @Transactional(readOnly = true)
    override fun ensureDisplayIndexFor(relation: ReviewerArticle) {
        val articleId = relation.article.id
        require(articleId.isNotBlank()) { "reviewer.articleIdRequiredForAssignment" }
        val resolved = determineDisplayIndex(articleId, relation.id.takeIf { it.isNotBlank() }, relation.displayIndex)
        relation.displayIndex = resolved
    }

    private fun determineDisplayIndex(articleId: String, relationId: String?, currentIndex: Int): Int {
        val occupied = reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(articleId)
            .filter { relationId == null || it.id != relationId }
            .mapNotNull { it.displayIndex.takeIf { idx -> idx > 0 } }
            .sorted()

        val existing = currentIndex.takeIf { it > 0 }
        if (existing != null && occupied.none { it == existing }) {
            return existing
        }

        var candidate = 1
        for (value in occupied) {
            if (value == candidate) {
                candidate++
            } else if (value > candidate) {
                break
            }
        }
        return candidate
    }
}
