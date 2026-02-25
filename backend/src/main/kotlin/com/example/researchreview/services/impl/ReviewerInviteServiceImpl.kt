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
        val token = CodeGen.genCode()
        val invite = ReviewerInvite().apply {
            this.tokenHash = CodeGen.sha256(token)
            this.email = normalizeEmail(email)
            this.articleId = articleId
            this.expiresAt = LocalDateTime.now().plusDays(ttlDays)
            this.usedAt = null
        }
        reviewerInviteRepository.save(invite)
        return token
    }

    @Transactional(readOnly = true)
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
            .orElseThrow { IllegalArgumentException("Article not found") }

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
            reviewerInviteRepository.findByTokenHash(tokenHash)
        }
            ?: throw IllegalArgumentException("Invalid invitation token")

        if (invite.usedAt != null) {
            throw IllegalArgumentException("Invitation token has already been used")
        }

        if (invite.expiresAt.isBefore(LocalDateTime.now())) {
            throw IllegalArgumentException("Invitation token has expired")
        }

        return invite
    }
}
