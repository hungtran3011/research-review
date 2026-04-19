package com.example.researchreview.services.impl

import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.entities.User
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ConferenceAuthorizationService
import com.example.researchreview.services.CurrentUserService
import org.slf4j.LoggerFactory
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service

@Service
class ConferenceAuthorizationServiceImpl(
    private val currentUserService: CurrentUserService,
    private val userRepository: UserRepository,
    private val articleRepository: ArticleRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
) : ConferenceAuthorizationService {

    override fun canSubmit(conferenceId: String, userId: String?): Boolean {
        val user = resolveUser(userId) ?: return false
        if (isGlobalAdmin(user)) return false
        return hasConferenceMembership(
            userId = user.id,
            conferenceId = conferenceId,
            allowedRoles = setOf(
                ConferenceMembershipRole.RESEARCHER,
                ConferenceMembershipRole.EDITOR,
            ),
        )
    }

    override fun canManageReview(articleId: String, userId: String?): Boolean {
        val user = resolveUser(userId) ?: return false
        if (isGlobalAdmin(user)) return true
        val conferenceId = resolveConferenceIdByArticle(articleId) ?: return false
        return hasConferenceMembership(
            userId = user.id,
            conferenceId = conferenceId,
            allowedRoles = setOf(ConferenceMembershipRole.EDITOR),
        )
    }

    override fun canFinalizeDecision(articleId: String, userId: String?): Boolean {
        val user = resolveUser(userId) ?: return false
        if (isGlobalAdmin(user)) return true
        val conferenceId = resolveConferenceIdByArticle(articleId) ?: return false
        return hasConferenceMembership(
            userId = user.id,
            conferenceId = conferenceId,
            allowedRoles = setOf(ConferenceMembershipRole.EDITOR),
        )
    }

    override fun canSubmitStructuredReview(articleId: String, userId: String?): Boolean {
        val user = resolveUser(userId) ?: return false

        val relation = reviewerArticleRepository
            .findByArticleIdAndReviewerUserIdOrEmail(articleId, user.id, user.email)
            .orElse(null)
            ?: return false

        if (relation.status != ReviewerInvitationStatus.ACCEPTED) {
            return false
        }

        val conferenceId = relation.article.conference?.id ?: resolveConferenceIdByArticle(articleId) ?: return false
        return hasConferenceMembership(user.id, conferenceId, allowedRoles = null)
    }

    override fun requireCanSubmit(conferenceId: String, endpoint: String, userId: String?) {
        if (canSubmit(conferenceId, userId)) return
        deny(
            action = "SUBMIT_ARTICLE",
            endpoint = endpoint,
            userId = userId,
            conferenceId = conferenceId,
            articleId = null,
            message = "authorization.submit.denied",
        )
    }

    override fun requireCanManageReview(articleId: String, endpoint: String, userId: String?) {
        if (canManageReview(articleId, userId)) return
        deny(
            action = "MANAGE_REVIEW",
            endpoint = endpoint,
            userId = userId,
            conferenceId = null,
            articleId = articleId,
            message = "authorization.manageReview.denied",
        )
    }

    override fun requireCanFinalizeDecision(articleId: String, endpoint: String, userId: String?) {
        if (canFinalizeDecision(articleId, userId)) return
        deny(
            action = "FINALIZE_DECISION",
            endpoint = endpoint,
            userId = userId,
            conferenceId = null,
            articleId = articleId,
            message = "authorization.finalizeDecision.denied",
        )
    }

    override fun requireCanSubmitStructuredReview(articleId: String, endpoint: String, userId: String?) {
        if (canSubmitStructuredReview(articleId, userId)) return
        deny(
            action = "SUBMIT_STRUCTURED_REVIEW",
            endpoint = endpoint,
            userId = userId,
            conferenceId = null,
            articleId = articleId,
            message = "authorization.submitStructuredReview.denied",
        )
    }

    private fun resolveUser(userId: String?): User? {
        val normalized = userId?.trim()?.takeIf { it.isNotBlank() }
        if (normalized != null) {
            return userRepository.findByIdAndDeletedFalse(normalized).orElse(null)
        }
        return currentUserService.currentUser()
    }

    private fun resolveConferenceIdByArticle(articleId: String): String? {
        return articleRepository.findByIdAndDeletedFalse(articleId).orElse(null)?.conference?.id
    }

    private fun isGlobalAdmin(user: User): Boolean = user.globalRole == GlobalRole.ADMIN

    private fun hasConferenceMembership(
        userId: String,
        conferenceId: String,
        allowedRoles: Set<ConferenceMembershipRole>?,
    ): Boolean {
        val membership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, userId)
            .orElse(null)
            ?: return false

        return allowedRoles?.contains(membership.membershipRole) ?: true
    }

    private fun deny(
        action: String,
        endpoint: String,
        userId: String?,
        conferenceId: String?,
        articleId: String?,
        message: String,
    ): Nothing {
        val effectiveUserId = userId?.trim()?.takeIf { it.isNotBlank() }
            ?: currentUserService.currentUser()?.id
            ?: "anonymous"

        logger.warn(
            "Authorization denied action={} endpoint={} userId={} conferenceId={} articleId={}",
            action,
            endpoint,
            effectiveUserId,
            conferenceId ?: "-",
            articleId ?: "-",
        )
        throw AccessDeniedException(message)
    }

    companion object {
        private val logger = LoggerFactory.getLogger(ConferenceAuthorizationServiceImpl::class.java)
    }
}
