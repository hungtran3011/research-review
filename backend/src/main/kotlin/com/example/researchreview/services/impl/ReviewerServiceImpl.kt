package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ArticleAccessGuard

import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.User
import com.example.researchreview.entities.UserRole
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.EmailService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.ReviewerArticleManager
import com.example.researchreview.services.ReviewerService
import com.example.researchreview.services.ReviewerInviteService
import jakarta.persistence.EntityNotFoundException
import org.apache.http.client.utils.URIBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ReviewerServiceImpl(
    private val reviewerRepository: ReviewerRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val articleRepository: ArticleRepository,
    private val institutionRepository: InstitutionRepository,
    private val userRepository: UserRepository,
    private val emailService: EmailService,
    private val notificationService: NotificationService,
    private val reviewerArticleManager: ReviewerArticleManager,
    private val articleAccessGuard: ArticleAccessGuard,
    private val currentUserService: CurrentUserService,
    private val reviewerInviteService: ReviewerInviteService
) : ReviewerService {

    @Value("\${custom.front-end-url}")
    private val frontendUrl: String = ""

    @Transactional
    override fun contactReviewers(articleId: String, request: ReviewerContactRequestDto): List<ReviewerDto> {
        val user = currentUserService.requireUser()
        if (!user.hasRole(Role.EDITOR)) {
            throw AccessDeniedException("Only EDITOR can contact reviewers")
        }

        val article = articleAccessGuard.fetchAccessibleArticle(articleId)
        if (article.status != ArticleStatus.PENDING_REVIEW) {
            throw IllegalStateException("Reviewers can only be contacted after initial review (PENDING_REVIEW)")
        }

        val reviewers = mutableListOf<Reviewer>()
        if (request.reviewerIds.isNotEmpty()) {
            val existing = reviewerRepository.findAllById(request.reviewerIds)
            if (existing.size != request.reviewerIds.size) {
                throw EntityNotFoundException("One or more reviewers could not be located")
            }
            reviewers.addAll(existing)
        }

        request.newReviewers.forEach { reviewers.add(upsertReviewer(it)) }

        if (reviewers.isEmpty()) {
            throw IllegalArgumentException("At least one reviewer must be provided")
        }

        val subject = request.subject.ifBlank { "Invitation to review \"${article.title}\"" }

        // Send one email per reviewer because each invite has a unique opaque token.
        reviewers.forEach { reviewer ->
            val token = reviewerInviteService.createInvite(reviewer.email, article.id)
            val inviteUrl = URIBuilder(frontendUrl)
                .setPath("/reviewer-invite")
                .addParameter("token", token)
                .build()
                .toString()

            val body = buildMessage(article, request.message, inviteUrl)
            emailService.sendEmail(
                to = listOf(reviewer.email),
                subject = subject,
                message = body,
                template = "contact-reviewer"
            )

            // Send in-app notification if reviewer has an associated user account
            if (reviewer.user != null) {
                notificationService.notifyUser(
                    reviewer.user!!.id,
                    NotificationType.REVIEWER_INVITED,
                    payload = mapOf(
                        "articleId" to article.id,
                        "articleTitle" to article.title,
                        "inviteUrl" to inviteUrl
                    ),
                    contextId = article.id,
                    contextType = "ARTICLE"
                )
            }
        }

        reviewers.forEach { linkReviewer(article, it) }
        return reviewers.map { toDto(it) }
    }

    @Transactional
    override fun revokeInvitation(articleId: String, reviewerId: String) {
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(articleId, reviewerId)
            ?: throw EntityNotFoundException("Reviewer not assigned to article")
    relation.status = ReviewerInvitationStatus.REVOKED
    relation.deleted = true
        reviewerArticleRepository.save(relation)
    }

    private fun upsertReviewer(dto: ReviewerRequestDto): Reviewer {
        val institution = institutionRepository.findById(dto.institutionId)
            .orElseThrow { EntityNotFoundException("Institution not found with id ${dto.institutionId}") }
        val reviewer = reviewerRepository.findByEmail(dto.email) ?: Reviewer()
        reviewer.name = dto.name
        reviewer.email = dto.email
        reviewer.institution = institution
        if (!dto.userId.isNullOrBlank()) {
            val user = userRepository.findById(dto.userId!!).orElse(null)
            if (user != null) {
                ensureUserHasRole(user, Role.REVIEWER)
                reviewer.user = user
            }
        }
        return reviewerRepository.save(reviewer)
    }

    private fun ensureUserHasRole(user: User, role: Role) {
        if (user.hasRole(role)) return
        if (user.roles.any { it.role == role }) return
        val ur = UserRole().apply {
            this.user = user
            this.role = role
        }
        user.roles.add(ur)
        userRepository.save(user)
    }

    private fun linkReviewer(article: Article, reviewer: Reviewer) {
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(article.id, reviewer.id)
            ?: ReviewerArticle().apply {
                this.article = article
                this.reviewer = reviewer
            }
        reviewerArticleManager.ensureDisplayIndexFor(relation)
        relation.deleted = false
        // Preserve acceptance; do not silently downgrade ACCEPTED to PENDING on subsequent invites.
        // If the editor truly wants to re-invite, they should revoke/re-invite explicitly.
        if (relation.status != ReviewerInvitationStatus.ACCEPTED) {
            relation.status = ReviewerInvitationStatus.PENDING
            relation.invitedAt = LocalDateTime.now()
        }
        reviewerArticleRepository.save(relation)
    }

    private fun buildMessage(article: Article, baseMessage: String): String {
        return buildMessage(article, baseMessage, inviteUrl = null)
    }

    private fun buildMessage(article: Article, baseMessage: String, inviteUrl: String?): String {
        val inviteHtml = inviteUrl?.let { "<p><strong>Reviewer invite:</strong> <a href=\"${'$'}it\">${'$'}it</a></p>" } ?: ""
        return """
            <p>${'$'}{baseMessage.trim()}</p>
            <p><strong>Article:</strong> ${'$'}{article.title}</p>
            <p><strong>Link:</strong> ${'$'}{article.link}</p>
            ${'$'}inviteHtml
        """.trimIndent()
    }

    private fun toDto(reviewer: Reviewer): ReviewerDto {
        return ReviewerDto(
            id = reviewer.id,
            name = reviewer.name,
            email = reviewer.email,
            institution = InstitutionDto(
                id = reviewer.institution.id,
                name = reviewer.institution.name,
                country = reviewer.institution.country
            ),
            user = reviewer.user?.let {
                UserDto(
                    id = it.id,
                    name = it.name,
                    role = it.role.name,
                    roles = it.effectiveRoles.map { role -> role.name },
                    email = it.email,
                    institution = it.institution?.let { inst ->
                        InstitutionDto(
                            id = inst.id,
                            name = inst.name,
                            country = inst.country
                        )
                    },
                    track = it.track?.let { t ->
                        TrackDto(
                            id = t.id,
                            name = t.name,
                            editors = emptyList(),
                            description = null,
                            isActive = true,
                            createdBy = null,
                            updatedBy = null
                        )
                    },
                    gender = it.gender,
                    nationality = it.nationality,
                    academicStatus = it.academicStatus,
                    status = it.status.name
                )
            },
            createdAt = reviewer.createdAt,
            updatedAt = reviewer.updatedAt,
            createdBy = reviewer.createdBy,
            updatedBy = reviewer.updatedBy
        )
    }
}
