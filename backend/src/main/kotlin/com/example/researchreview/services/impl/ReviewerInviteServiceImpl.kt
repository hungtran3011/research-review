package com.example.researchreview.services.impl

import com.example.researchreview.dtos.ReviewerInviteResolveDto
import com.example.researchreview.entities.ReviewerInvite
import com.example.researchreview.repositories.ReviewerInviteRepository
import com.example.researchreview.services.ReviewerInviteService
import com.example.researchreview.utils.CodeGen
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ReviewerInviteServiceImpl(
    private val reviewerInviteRepository: ReviewerInviteRepository
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
        val invite = findValidInviteOrThrow(token)
        return ReviewerInviteResolveDto(email = invite.email, articleId = invite.articleId)
    }

    @Transactional
    override fun consume(token: String): ReviewerInviteResolveDto {
        val invite = findValidInviteOrThrow(token)
        invite.usedAt = LocalDateTime.now()
        reviewerInviteRepository.save(invite)
        return ReviewerInviteResolveDto(email = invite.email, articleId = invite.articleId)
    }

    private fun findValidInviteOrThrow(token: String): ReviewerInvite {
        val tokenHash = CodeGen.sha256(token)
        val invite = reviewerInviteRepository.findByTokenHash(tokenHash)
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
