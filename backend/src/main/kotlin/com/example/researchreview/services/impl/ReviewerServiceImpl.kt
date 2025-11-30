package com.example.researchreview.services.impl

import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.mappers.ReviewerMapper
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.EmailService
import com.example.researchreview.services.ReviewerService
import jakarta.persistence.EntityNotFoundException
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
    private val reviewerMapper: ReviewerMapper
) : ReviewerService {

    @Transactional
    override fun contactReviewers(articleId: String, request: ReviewerContactRequestDto): List<ReviewerDto> {
        val article = articleRepository.findByIdAndDeletedFalse(articleId)
            .orElseThrow { EntityNotFoundException("Article not found with id $articleId") }

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
        val body = buildMessage(article, request.message)
        emailService.sendEmail(
            to = reviewers.map { it.email },
            subject = subject,
            message = body,
            template = "contact-reviewer"
        )

        reviewers.forEach { linkReviewer(article, it) }
        return reviewers.map { reviewerMapper.toDto(it) }
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
            reviewer.user = userRepository.findById(dto.userId!!).orElse(reviewer.user)
        }
        return reviewerRepository.save(reviewer)
    }

    private fun linkReviewer(article: Article, reviewer: Reviewer) {
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(article.id, reviewer.id)
            ?: ReviewerArticle().apply {
                this.article = article
                this.reviewer = reviewer
            }
        relation.deleted = false
        relation.status = ReviewerInvitationStatus.PENDING
        relation.invitedAt = LocalDateTime.now()
        reviewerArticleRepository.save(relation)
    }

    private fun buildMessage(article: Article, baseMessage: String): String {
        return """
            <p>${'$'}{baseMessage.trim()}</p>
            <p><strong>Article:</strong> ${'$'}{article.title}</p>
            <p><strong>Link:</strong> ${'$'}{article.link}</p>
        """.trimIndent()
    }
}
