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
        return when {
            user.hasRole(Role.ADMIN) -> articleRepository.findAllByDeletedFalse(pageable)
            user.hasRole(Role.EDITOR) -> user.track?.id?.let { trackId ->
                articleRepository.findAllByDeletedFalseAndTrackId(trackId, pageable)
            } ?: Page.empty(pageable)
            user.hasRole(Role.REVIEWER) -> articleRepository.findAllByReviewerUserIdOrEmail(user.id, user.email, pageable)
            user.hasRole(Role.RESEARCHER) -> articleRepository.findAllByAuthorUserId(user.id, pageable)
            else -> Page.empty(pageable)
        }
    }

    override fun fetchAccessibleArticle(articleId: String): Article {
        val user = currentUserService.currentUser()
        val article = when {
            user == null || user.hasRole(Role.ADMIN) -> {
                articleRepository.findByIdAndDeletedFalse(articleId).orElse(null)
            }
            user.hasRole(Role.EDITOR) -> {
                user.track?.id?.let { trackId ->
                    articleRepository.findByIdAndDeletedFalseAndTrackId(articleId, trackId)
                }?.orElse(null)
            }
            else -> {
                val reviewerHit = if (user.hasRole(Role.REVIEWER)) {
                    articleRepository.findByIdForReviewerOrEmail(articleId, user.id, user.email)?.orElse(null)
                } else {
                    null
                }
                reviewerHit ?: if (user.hasRole(Role.RESEARCHER)) {
                    // Check if user is author OR creator of the article
                    articleRepository.findByIdForAuthor(articleId, user.id)?.orElse(null)
                        ?: articleRepository.findByIdAndCreator(articleId, user.id).orElse(null)
                } else {
                    null
                }
            }
        }

        return article ?: throw EntityNotFoundException("Article not found or access denied")
    }
}
