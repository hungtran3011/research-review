package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.ReviewerInviteDecisionDto
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ReviewerInviteDecisionService
import com.example.researchreview.services.ReviewerInviteService
import com.example.researchreview.utils.SecurityUtils
import jakarta.persistence.EntityNotFoundException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ReviewerInviteDecisionServiceImpl(
    private val reviewerInviteService: ReviewerInviteService,
    private val reviewerRepository: ReviewerRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val articleRepository: ArticleRepository,
    private val userRepository: UserRepository
) : ReviewerInviteDecisionService {

    @Transactional
    override fun accept(token: String): ReviewerInviteDecisionDto = decide(token, accept = true)

    @Transactional
    override fun decline(token: String): ReviewerInviteDecisionDto = decide(token, accept = false)

    private fun decide(token: String, accept: Boolean): ReviewerInviteDecisionDto {
        val invite = reviewerInviteService.consume(token)

        val userId = SecurityUtils.currentUserId()
        val user = userRepository.findById(userId)
            .orElseThrow { AccessDeniedException("Authentication required") }

        val userEmail = user.email.trim().lowercase()
        if (userEmail != invite.email.trim().lowercase()) {
            throw AccessDeniedException("This invitation does not belong to the current user")
        }

        val reviewer = reviewerRepository.findByEmail(invite.email)
            ?: throw EntityNotFoundException("Reviewer not found for email ${invite.email}")

        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(invite.articleId, reviewer.id)
            ?: throw EntityNotFoundException("Reviewer is not assigned to this article")

        if (relation.deleted || relation.status == ReviewerInvitationStatus.REVOKED) {
            throw IllegalStateException("Invitation has been revoked")
        }

        relation.status = if (accept) ReviewerInvitationStatus.ACCEPTED else ReviewerInvitationStatus.DECLINED
        reviewerArticleRepository.save(relation)

        val article = articleRepository.findById(invite.articleId)
            .orElseThrow { EntityNotFoundException("Article not found with id ${invite.articleId}") }

        if (accept && article.status == ArticleStatus.PENDING_REVIEW) {
            article.status = ArticleStatus.IN_REVIEW
            articleRepository.save(article)
        }

        return ReviewerInviteDecisionDto(
            articleId = article.id,
            articleStatus = article.status,
            reviewerStatus = relation.status
        )
    }
}
