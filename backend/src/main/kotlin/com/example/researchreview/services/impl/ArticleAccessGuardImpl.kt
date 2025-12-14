package com.example.researchreview.services.impl

import com.example.researchreview.constants.Role
import com.example.researchreview.entities.Article
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.CurrentUserService
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class ArticleAccessGuardImpl(
    private val articleRepository: ArticleRepository,
    private val currentUserService: CurrentUserService
) : ArticleAccessGuard {

    override fun listAccessibleArticles(pageable: Pageable): Page<Article> {
        val user = currentUserService.currentUser() ?: return articleRepository.findAllByDeletedFalse(pageable)
        return when (user.role) {
            Role.ADMIN -> articleRepository.findAllByDeletedFalse(pageable)
            Role.EDITOR -> user.track?.id?.let { trackId ->
                articleRepository.findAllByDeletedFalseAndTrackId(trackId, pageable)
            } ?: Page.empty(pageable)
            Role.REVIEWER -> articleRepository.findAllByReviewerUserId(user.id, pageable)
            Role.RESEARCHER -> articleRepository.findAllByAuthorUserId(user.id, pageable)
            else -> Page.empty(pageable)
        }
    }

    override fun fetchAccessibleArticle(articleId: String): Article {
        val user = currentUserService.currentUser()
        val article = when (user?.role) {
            null, Role.ADMIN -> articleRepository.findByIdAndDeletedFalse(articleId)
            Role.EDITOR -> user.track?.id?.let { trackId ->
                articleRepository.findByIdAndDeletedFalseAndTrackId(articleId, trackId)
            }
            Role.REVIEWER -> articleRepository.findByIdForReviewer(articleId, user.id)
            Role.RESEARCHER -> articleRepository.findByIdForAuthor(articleId, user.id)
            else -> articleRepository.findByIdAndDeletedFalse(articleId)
        }?.orElse(null)

        return article ?: throw EntityNotFoundException("Article not found or access denied")
    }
}
