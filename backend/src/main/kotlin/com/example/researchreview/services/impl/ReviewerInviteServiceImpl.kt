package com.example.researchreview.services.impl

import com.example.researchreview.dtos.ReviewerInviteResolveDto
import com.example.researchreview.entities.ReviewerInvite
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ReviewerInviteRepository
import com.example.researchreview.services.ReviewerInviteService
import com.example.researchreview.utils.CodeGen
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ReviewerInviteServiceImpl(
    private val reviewerInviteRepository: ReviewerInviteRepository,
    private val articleRepository: ArticleRepository,
    private val articleAuthorRepository: ArticleAuthorRepository
) : ReviewerInviteService {

    private val ttlDays: Long = 7

    private fun normalizeEmail(email: String) = email.trim().lowercase()

    @Transactional
    override fun createInvite(email: String, articleId: String): String {
        val normalizedEmail = normalizeEmail(email)
        deactivatePreviousPendingInvites(normalizedEmail, articleId)

        val token = CodeGen.genCode()
        val invite = ReviewerInvite().apply {
            this.tokenHash = CodeGen.sha256(token)
            this.email = normalizedEmail
            this.articleId = articleId
            this.expiresAt = LocalDateTime.now().plusDays(ttlDays)
            this.usedAt = null
        }
        reviewerInviteRepository.save(invite)
        return token
    }

    @Transactional
    override fun resolve(token: String): ReviewerInviteResolveDto {
        val invite = findValidInviteOrThrow(token, forUpdate = false)
        return toResolveDto(invite)
    }

    @Transactional
    override fun consume(token: String): ReviewerInviteResolveDto {
        val invite = findValidInviteOrThrow(token, forUpdate = true)
        invite.usedAt = LocalDateTime.now()
        reviewerInviteRepository.save(invite)
        return toResolveDto(invite)
    }

    private fun toResolveDto(invite: ReviewerInvite): ReviewerInviteResolveDto {
        val article = articleRepository.findByIdAndDeletedFalse(invite.articleId)
            .orElseThrow { IllegalArgumentException("reviewerInvite.articleNotFound") }

        val authors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(invite.articleId)
            .sortedBy { it.authorOrder }
            .map { it.author.name }

        return ReviewerInviteResolveDto(
            email = invite.email,
            articleId = invite.articleId,
            articleTitle = article.title,
            trackName = article.track.name,
            authors = authors
        )
    }

    private fun findValidInviteOrThrow(token: String, forUpdate: Boolean): ReviewerInvite {
        val tokenHash = CodeGen.sha256(token)
        val invite = if (forUpdate) {
            reviewerInviteRepository.findByTokenHashForUpdate(tokenHash)
        } else {
            reviewerInviteRepository.findByTokenHashAndDeletedFalse(tokenHash)
        }
            ?: throw IllegalArgumentException("reviewerInvite.invalidToken")

        if (invite.usedAt != null) {
            throw IllegalArgumentException("reviewerInvite.tokenUsed")
        }

        if (invite.expiresAt.isBefore(LocalDateTime.now())) {
            invite.deleted = true
            reviewerInviteRepository.save(invite)
            throw IllegalArgumentException("reviewerInvite.tokenExpired")
        }

        return invite
    }

    private fun deactivatePreviousPendingInvites(email: String, articleId: String) {
        val now = LocalDateTime.now()
        reviewerInviteRepository
            .findAllByArticleIdAndEmailAndUsedAtIsNullAndDeletedFalse(articleId, email)
            .forEach { existing ->
                existing.deleted = true
                if (existing.expiresAt.isBefore(now) && existing.usedAt == null) {
                    existing.usedAt = now
                }
            }
    }
}
