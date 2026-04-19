package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.StructuredReviewAnonymizedDto
import com.example.researchreview.dtos.StructuredReviewDto
import com.example.researchreview.dtos.StructuredReviewScoreDto
import com.example.researchreview.dtos.StructuredReviewSubmitRequestDto
import com.example.researchreview.entities.StructuredReview
import com.example.researchreview.entities.StructuredReviewScore
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.StructuredReviewRepository
import com.example.researchreview.repositories.StructuredReviewScoreRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.services.ConferenceAuthorizationService
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.StructuredReviewService
import jakarta.persistence.EntityNotFoundException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class StructuredReviewServiceImpl(
    private val articleRepository: ArticleRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val structuredReviewRepository: StructuredReviewRepository,
    private val structuredReviewScoreRepository: StructuredReviewScoreRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
    private val conferenceAuthorizationService: ConferenceAuthorizationService,
    private val currentUserService: CurrentUserService,
    private val notificationService: NotificationService,
) : StructuredReviewService {

    @Transactional
    override fun saveOrSubmit(articleId: String, request: StructuredReviewSubmitRequestDto): StructuredReviewDto {
        val currentUser = currentUserService.requireUser()
        val article = articleRepository.findByIdAndDeletedFalse(articleId)
            .orElseThrow { EntityNotFoundException("structuredReview.articleNotFound") }

        if (article.status != ArticleStatus.IN_REVIEW && article.status != ArticleStatus.REVIEWS_COMPLETED) {
            throw IllegalStateException("structuredReview.invalidArticleStatus")
        }

        val reviewerArticle = reviewerArticleRepository
            .findByArticleIdAndReviewerUserIdOrEmail(articleId, currentUser.id, currentUser.email)
            .orElseThrow { EntityNotFoundException("structuredReview.reviewerAssignmentNotFound") }

        if (reviewerArticle.status != ReviewerInvitationStatus.ACCEPTED) {
            throw IllegalStateException("structuredReview.reviewerInvitationNotAccepted")
        }

        val normalizedScores = request.scores
            .map { it.copy(criterion = it.criterion.trim()) }
            .filter { it.criterion.isNotBlank() }
        if (normalizedScores.isEmpty()) {
            throw IllegalArgumentException("structuredReview.atLeastOneCriterionRequired")
        }
        val duplicateCriterion = normalizedScores
            .groupBy { it.criterion.lowercase() }
            .any { it.value.size > 1 }
        if (duplicateCriterion) {
            throw IllegalArgumentException("structuredReview.duplicateCriteriaNotAllowed")
        }

        val existing = structuredReviewRepository.findByReviewerArticleIdAndDeletedFalse(reviewerArticle.id)
        if (existing?.submittedAt != null) {
            throw IllegalStateException("structuredReview.alreadySubmitted")
        }

        val review = (existing ?: StructuredReview().apply { this.reviewerArticle = reviewerArticle }).apply {
            summaryNotes = request.summaryNotes.trim()
            confidentialRemarks = request.confidentialRemarks?.trim()?.ifBlank { null }
            recommendation = request.recommendation
            if (request.finalSubmit) {
                submittedAt = LocalDateTime.now()
            }
        }

        val savedReview = structuredReviewRepository.save(review)
        syncScores(savedReview, normalizedScores.map { StructuredReviewScoreDto(it.criterion, it.score) })

        if (request.finalSubmit && article.status == ArticleStatus.IN_REVIEW) {
            maybeMoveToReviewsCompleted(articleId)
        }

        return toDto(savedReview)
    }

    @Transactional(readOnly = true)
    override fun getMyReview(articleId: String): StructuredReviewDto? {
        val currentUser = currentUserService.requireUser()
        val reviewerArticle = reviewerArticleRepository
            .findByArticleIdAndReviewerUserIdOrEmail(articleId, currentUser.id, currentUser.email)
            .orElse(null) ?: return null
        val review = structuredReviewRepository.findByReviewerArticleIdAndDeletedFalse(reviewerArticle.id) ?: return null
        return toDto(review)
    }

    @Transactional(readOnly = true)
    override fun getEditorView(articleId: String): List<StructuredReviewDto> {
        conferenceAuthorizationService.requireCanManageReview(articleId, "GET /api/v1/articles/{articleId}/structured-reviews/editor-view")
        return structuredReviewRepository.findAllByReviewerArticleArticleIdAndDeletedFalse(articleId)
            .sortedBy { it.reviewerArticle.displayIndex }
            .map { toDto(it) }
    }

    @Transactional(readOnly = true)
    override fun getChairView(articleId: String): List<StructuredReviewDto> = getEditorView(articleId)

    @Transactional(readOnly = true)
    override fun getAnonymizedView(articleId: String): List<StructuredReviewAnonymizedDto> {
        requireCanViewAnonymized(articleId)
        return structuredReviewRepository.findAllByReviewerArticleArticleIdAndSubmittedAtIsNotNullAndDeletedFalse(articleId)
            .sortedBy { it.reviewerArticle.displayIndex }
            .map { review ->
                StructuredReviewAnonymizedDto(
                    id = review.id,
                    articleId = review.reviewerArticle.article.id,
                    reviewerLabel = "Reviewer ${review.reviewerArticle.displayIndex}",
                    scores = scoreDtos(review.id),
                    summaryNotes = review.summaryNotes,
                    submittedAt = review.submittedAt,
                )
            }
    }

    private fun requireCanViewAnonymized(articleId: String) {
        val currentUser = currentUserService.requireUser()
        if (currentUser.globalRole == GlobalRole.ADMIN) {
            return
        }

        if (conferenceAuthorizationService.canManageReview(articleId, currentUser.id)) {
            return
        }

        val isAuthor = articleRepository.findByIdForAuthor(articleId, currentUser.id).isPresent ||
            articleRepository.findByIdAndCreator(articleId, currentUser.id).isPresent

        if (!isAuthor) {
            throw AccessDeniedException("structuredReview.anonymizedViewForbidden")
        }
    }

    private fun syncScores(review: StructuredReview, scores: List<StructuredReviewScoreDto>) {
        val existing = structuredReviewScoreRepository.findAllByStructuredReviewIdAndDeletedFalse(review.id)
        existing.forEach {
            it.deleted = true
            structuredReviewScoreRepository.save(it)
        }
        scores.forEach { score ->
            structuredReviewScoreRepository.save(
                StructuredReviewScore().apply {
                    this.structuredReview = review
                    this.criterion = score.criterion
                    this.score = score.score
                }
            )
        }
    }

    private fun scoreDtos(structuredReviewId: String): List<StructuredReviewScoreDto> {
        return structuredReviewScoreRepository.findAllByStructuredReviewIdAndDeletedFalse(structuredReviewId)
            .map { StructuredReviewScoreDto(it.criterion, it.score) }
    }

    private fun toDto(review: StructuredReview): StructuredReviewDto {
        return StructuredReviewDto(
            id = review.id,
            articleId = review.reviewerArticle.article.id,
            reviewerId = review.reviewerArticle.reviewer.id,
            reviewerName = review.reviewerArticle.reviewer.name,
            reviewerEmail = review.reviewerArticle.reviewer.email,
            reviewerDisplayIndex = review.reviewerArticle.displayIndex,
            scores = scoreDtos(review.id),
            summaryNotes = review.summaryNotes,
            confidentialRemarks = review.confidentialRemarks,
            recommendation = review.recommendation,
            submittedAt = review.submittedAt,
        )
    }

    private fun maybeMoveToReviewsCompleted(articleId: String) {
        val article = articleRepository.findByIdAndDeletedFalse(articleId)
            .orElseThrow { EntityNotFoundException("structuredReview.articleNotFound") }
        if (article.status != ArticleStatus.IN_REVIEW) {
            return
        }

        val completedCount = structuredReviewRepository
            .countByReviewerArticleArticleIdAndReviewerArticleStatusAndSubmittedAtIsNotNullAndDeletedFalse(
                articleId,
                ReviewerInvitationStatus.ACCEPTED,
            )
            .toInt()

        val threshold = article.track.reviewPolicyMinCompletedReviews
            ?: article.conference?.minimumCompletedReviews
            ?: 3

        if (completedCount < threshold) {
            return
        }

        article.status = ArticleStatus.REVIEWS_COMPLETED
        articleRepository.save(article)

        val conferenceId = article.conference?.id ?: return
        val editorUserIds = userConferenceMembershipRepository
            .findAllByConferenceIdAndMembershipRoleAndDeletedFalse(conferenceId, ConferenceMembershipRole.EDITOR)
            .map { it.user.id }
            .filter { it.isNotBlank() }
            .distinct()

        if (editorUserIds.isNotEmpty()) {
            notificationService.notifyUsers(
                editorUserIds,
                NotificationType.REVIEW_THRESHOLD_REACHED,
                payload = mapOf(
                    "articleId" to article.id,
                    "title" to article.title,
                    "completedReviews" to completedCount,
                    "requiredReviews" to threshold,
                ),
                contextId = article.id,
                contextType = "ARTICLE",
            )
        }
    }
}
