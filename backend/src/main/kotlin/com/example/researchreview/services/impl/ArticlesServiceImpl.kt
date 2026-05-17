package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.constants.InitialReviewDecision
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.configs.FeatureFlagsProperties
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleDashboardStatsDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.AuthorDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ArticleAuthor
import com.example.researchreview.entities.ArticleVersion
import com.example.researchreview.entities.ArticleTopic
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.entities.Topic
import com.example.researchreview.entities.User
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ArticleTopicRepository
import com.example.researchreview.repositories.ArticleVersionRepository
import com.example.researchreview.repositories.AuthorRepository
import com.example.researchreview.repositories.AttachmentRepository
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.TopicRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.repositories.StructuredReviewRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.ArticlesService
import com.example.researchreview.services.ConferenceAuthorizationService
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.EmailService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.ReviewerArticleManager
import com.example.researchreview.services.ReviewerInviteService
import com.example.researchreview.services.AttachmentService
import jakarta.persistence.EntityNotFoundException
import org.apache.http.client.utils.URIBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.access.AccessDeniedException
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime

@Service
class ArticlesServiceImpl(
    private val articleRepository: ArticleRepository,
    private val conferenceRepository: ConferenceRepository,
    private val trackRepository: TrackRepository,
    private val topicRepository: TopicRepository,
    private val articleTopicRepository: ArticleTopicRepository,
    private val articleVersionRepository: ArticleVersionRepository,
    private val authorRepository: AuthorRepository,
    private val reviewerRepository: ReviewerRepository,
    private val articleAuthorRepository: ArticleAuthorRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val institutionRepository: InstitutionRepository,
    private val userRepository: UserRepository,
    private val editorRepository: EditorRepository,
    private val reviewerArticleManager: ReviewerArticleManager,
    private val articleAccessGuard: ArticleAccessGuard,
    private val conferenceAuthorizationService: ConferenceAuthorizationService,
    private val notificationService: NotificationService,
    private val currentUserService: CurrentUserService,
    private val emailService: EmailService,
    private val reviewerInviteService: ReviewerInviteService,
    private val attachmentService: AttachmentService,
    private val attachmentRepository: AttachmentRepository,
    private val structuredReviewRepository: StructuredReviewRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
    private val featureFlagsProperties: FeatureFlagsProperties,
) : ArticlesService {

    @Value("\${custom.front-end-url}")
    private val frontendUrl: String = ""

    @Transactional(readOnly = true)
    override fun getAll(pageable: Pageable): Page<ArticleDto> {
        val effectivePageable = pageable.withDefaultCreatedAtDescSort()
        val page = articleAccessGuard.listAccessibleArticles(effectivePageable)
        return page.map { toDto(it) }
    }

    @Transactional(readOnly = true)
    override fun getAll(
        pageable: Pageable,
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Page<ArticleDto> {
        val effectivePageable = pageable.withDefaultCreatedAtDescSort()
        val page = articleAccessGuard.listAccessibleArticles(effectivePageable, title, author, status)
        return page.map { toDto(it) }
    }

    private fun Pageable.withDefaultCreatedAtDescSort(): Pageable {
        if (sort.isSorted) return this
        return PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
    }

    @Transactional(readOnly = true)
    override fun getDashboardStats(
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): ArticleDashboardStatsDto {
        val total = articleAccessGuard.countAccessibleArticles(title, author, status)
        val accepted = articleAccessGuard.countAccessibleArticles(title, author, ArticleStatus.ACCEPTED)
        val rejected = articleAccessGuard.countAccessibleArticles(title, author, ArticleStatus.REJECTED)

        val pendingStatuses = listOf(
            ArticleStatus.SUBMITTED,
            ArticleStatus.PENDING_REVIEW,
            ArticleStatus.IN_REVIEW,
            ArticleStatus.REVISIONS_REQUESTED,
            ArticleStatus.REVISIONS,
        )
        val pending = pendingStatuses.sumOf {
            articleAccessGuard.countAccessibleArticles(title, author, it)
        }

        return ArticleDashboardStatsDto(
            total = total,
            pending = pending,
            accepted = accepted,
            rejected = rejected,
        )
    }

    @Transactional(readOnly = true)
    override fun getById(id: String): ArticleDto = toDto(fetchArticle(id))

    @Transactional
    override fun create(articleDto: ArticleRequestDto): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val conference = conferenceRepository.findByIdAndDeletedFalse(articleDto.conferenceId)
            .orElseThrow { EntityNotFoundException("conference.notFound") }
        ensureSubmitterConferenceMembership(currentUser, conference.id)
        ensureConferenceOpenForSubmission(conference.status, conference.submissionDeadline)

        val track = trackRepository.findByIdAndConferenceIdAndDeletedFalse(articleDto.trackId, conference.id)
            .orElseThrow { EntityNotFoundException("track.notFoundInConference") }
        val topics = resolveSubmissionTopics(conference.id, track.id, articleDto.topicIds)

        val article = Article().apply {
            title = articleDto.title
            abstract = articleDto.abstract
            conclusion = articleDto.conclusion
            link = articleDto.link
            this.conference = conference
            this.track = track
            status = ArticleStatus.SUBMITTED
        }
        val saved = articleRepository.saveAndFlush(article)
        syncAuthors(saved, articleDto.authors)
        syncTopics(saved, topics)
        notifyArticleSubmitted(saved)
        sendSubmissionConfirmationEmail(saved)
        return toDto(saved)
    }

    private fun ensureSubmitterConferenceMembership(user: User, conferenceId: String) {
        val existingMembership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, user.id)
            .orElse(null)
        if (existingMembership == null) {
            throw AccessDeniedException("conference.registration.required")
        }
    }

    @Transactional
    override fun update(articleDto: ArticleRequestDto): ArticleDto {
        val articleId = articleDto.id ?: throw IllegalArgumentException("articles.idRequiredForUpdate")
        val article = fetchArticle(articleId)

        val conference = conferenceRepository.findByIdAndDeletedFalse(articleDto.conferenceId)
            .orElseThrow { EntityNotFoundException("conference.notFound") }
        val track = trackRepository.findByIdAndConferenceIdAndDeletedFalse(articleDto.trackId, conference.id)
            .orElseThrow { EntityNotFoundException("track.notFoundInConference") }
        val topics = resolveSubmissionTopics(conference.id, track.id, articleDto.topicIds)

        article.title = articleDto.title
        article.abstract = articleDto.abstract
        article.conclusion = articleDto.conclusion
        article.link = articleDto.link
        article.conference = conference
        article.track = track

        val saved = articleRepository.saveAndFlush(article)
        syncAuthors(saved, articleDto.authors)
        syncTopics(saved, topics)
        return toDto(saved)
    }

    @Transactional
    override fun delete(id: String) {
        val article = fetchArticle(id)
        article.deleted = true
        articleRepository.save(article)
    }

    @Transactional
    override fun assignReviewer(id: String, reviewer: ReviewerRequestDto): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)
        ensureReviewerManagementPermission(currentUser, article)
        
        // Only allow reviewer assignment in specific workflow states
        if (article.status !in setOf(
            ArticleStatus.PENDING_REVIEW,
            ArticleStatus.IN_REVIEW,
            ArticleStatus.REVIEWS_COMPLETED
        )) {
            throw IllegalStateException("articles.canOnlyAssignReviewersInReviewPhase")
        }
        
        val reviewerEntity = resolveReviewer(reviewer)
        val existingRelation = reviewerArticleRepository.findByArticleIdAndReviewerId(article.id, reviewerEntity.id)
        val isNewAssignment = existingRelation == null || existingRelation.status == ReviewerInvitationStatus.REVOKED
        
        val relation = existingRelation ?: ReviewerArticle().apply {
            this.article = article
            this.reviewer = reviewerEntity
        }
        reviewerArticleManager.ensureDisplayIndexFor(relation)
        relation.deleted = false
        
        // Preserve acceptance; don't downgrade ACCEPTED to PENDING if already accepted.
        if (relation.status != ReviewerInvitationStatus.ACCEPTED) {
            relation.status = ReviewerInvitationStatus.PENDING
            relation.invitedAt = LocalDateTime.now()
        }
        val savedRelation = reviewerArticleRepository.save(relation)
        notifyReviewerInvitation(savedRelation, isNewAssignment)
        return toDto(article)
    }

    @Transactional
    override fun unassignReviewer(id: String, reviewerId: String): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)
        ensureReviewerManagementPermission(currentUser, article)
        
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(id, reviewerId)
            ?: throw EntityNotFoundException("reviewer.relationNotFound")
        relation.deleted = true
        val savedRelation = reviewerArticleRepository.save(relation)
        notifyReviewerRevocation(savedRelation)
        return getById(id)
    }

    @Transactional
    override fun reject(id: String) {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)
        ensureChairDecisionPermission(currentUser, article)
        if (article.status != ArticleStatus.REVIEWS_COMPLETED) {
            throw IllegalStateException("articles.rejectOnlyWhenReviewsCompleted")
        }
        updateStatus(id, ArticleStatus.REJECTED)
        val updatedArticle = fetchArticle(id)
        sendChairDecisionEmailToAuthors(updatedArticle, ArticleStatus.REJECTED)
    }

    @Transactional
    override fun approve(id: String) {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)
        ensureChairDecisionPermission(currentUser, article)
        if (article.status != ArticleStatus.REVIEWS_COMPLETED) {
            throw IllegalStateException("articles.approveOnlyWhenReviewsCompleted")
        }
        updateStatus(id, ArticleStatus.ACCEPTED)
        val updatedArticle = fetchArticle(id)
        sendChairDecisionEmailToAuthors(updatedArticle, ArticleStatus.ACCEPTED)
    }

    @Transactional(readOnly = true)
    override fun getReviewers(id: String): List<ReviewerDto> =
        run {
            conferenceAuthorizationService.requireCanManageReview(id, "GET /api/v1/articles/{id}/reviewers")
            reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(id).map { reviewerToDto(it.reviewer) }
        }

    @Transactional(readOnly = true)
    override fun getReviewerCandidates(id: String): List<com.example.researchreview.dtos.UserDto> {
        val article = fetchArticle(id)
        val conferenceId = article.conference?.id ?: throw EntityNotFoundException("conference.notFound")

        val submittedUserIds = mutableSetOf<String>()

        articleRepository.findAllByConferenceIdAndDeletedFalse(conferenceId)
            .mapNotNull { it.createdBy.takeIf { userId -> userId.isNotBlank() } }
            .forEach { submittedUserIds.add(it) }

        articleAuthorRepository.findAllByArticleConferenceIdAndDeletedFalse(conferenceId)
            .mapNotNull { it.author.user?.id?.takeIf { userId -> userId.isNotBlank() } }
            .forEach { submittedUserIds.add(it) }

        return userRepository.findAllByDeletedFalse()
            .asSequence()
            .filterNot { user -> user.globalRole == GlobalRole.ADMIN }
            .filterNot { user -> submittedUserIds.contains(user.id) }
            .sortedBy { user -> user.name.lowercase() }
            .map { user -> userToDto(user) }
            .toList()
    }

    @Transactional
    override fun markReviewsCompleted(id: String): ArticleDto {
        val article = fetchArticle(id)
        if (article.status != ArticleStatus.IN_REVIEW) {
            throw IllegalStateException("articles.reviewCompletionOnlyWhenInReview")
        }

        if (featureFlagsProperties.reviewThresholdGateEnabled) {
            val completedCount = structuredReviewRepository
                .countByReviewerArticleArticleIdAndReviewerArticleStatusAndSubmittedAtIsNotNullAndDeletedFalse(
                    id,
                    ReviewerInvitationStatus.ACCEPTED,
                )
                .toInt()
            val threshold = article.track.reviewPolicyMinCompletedReviews
                ?: article.conference?.minimumCompletedReviews
                ?: 3
            if (completedCount < threshold) {
                throw IllegalStateException(
                    "articles.reviewThresholdNotMet"
                )
            }
        }

        updateStatus(id, ArticleStatus.REVIEWS_COMPLETED)
        return getById(id)
    }

    @Transactional
    override fun requestRevisions(id: String): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)
        ensureChairDecisionPermission(currentUser, article)
        if (article.status != ArticleStatus.REVIEWS_COMPLETED) {
            throw IllegalStateException("articles.revisionRequestOnlyWhenReviewsCompleted")
        }
        updateStatus(id, ArticleStatus.REVISIONS_REQUESTED)
        val updatedArticle = fetchArticle(id)
        sendChairDecisionEmailToAuthors(updatedArticle, ArticleStatus.REVISIONS_REQUESTED)
        return toDto(updatedArticle)
    }

    @Transactional
    override fun initialReview(articleId: String, request: InitialReviewRequestDto): ArticleDto {
        val article = fetchArticle(articleId)
        val previousStatus = article.status
        if (previousStatus != ArticleStatus.SUBMITTED) {
            throw IllegalStateException("articles.initialReviewOnlyWhenSubmitted")
        }
        article.initialReviewNote = request.note
        article.initialReviewNextSteps = request.nextSteps
        article.status = when (request.decision) {
            InitialReviewDecision.SEND_TO_REVIEW -> ArticleStatus.PENDING_REVIEW
            InitialReviewDecision.REQUEST_CHANGES -> ArticleStatus.REVISIONS_REQUESTED
            InitialReviewDecision.REJECT -> ArticleStatus.REJECTED
        }
        val saved = articleRepository.save(article)
        if (previousStatus != saved.status) {
            notifyArticleStatusChanged(saved, previousStatus)
        }
        return toDto(saved)
    }

    @Transactional
    override fun updateLink(id: String, link: String): ArticleDto {
        val article = fetchArticle(id)
        article.link = link
        val saved = articleRepository.save(article)
        return toDto(saved)
    }

    private fun updateStatus(id: String, status: ArticleStatus) {
        val article = fetchArticle(id)
        val previousStatus = article.status
        if (previousStatus == status) {
            return
        }
        article.status = status
        val saved = articleRepository.save(article)
        notifyArticleStatusChanged(saved, previousStatus)
    }

    private fun syncAuthors(article: Article, authors: List<AuthorDto>) {
        val existing = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
        existing.forEach {
            it.deleted = true
            articleAuthorRepository.save(it)
        }
        // Ensure we have a managed article instance by fetching it fresh
        val managedArticle = articleRepository.findById(article.id)
            .orElseThrow { EntityNotFoundException(com.example.researchreview.constants.ErrorCode.ARTICLE_NOT_FOUND.key) }
        authors.forEachIndexed { index, dto ->
            val savedAuthor = persistAuthor(dto)
            val relation = ArticleAuthor().apply {
                this.article = managedArticle
                this.author = savedAuthor
                this.authorOrder = index
            }
            articleAuthorRepository.save(relation)
        }
    }

    private fun syncTopics(article: Article, topics: List<Topic>) {
        val existing = articleTopicRepository.findAllByArticleIdAndDeletedFalse(article.id)
        existing.forEach {
            it.deleted = true
            articleTopicRepository.save(it)
        }

        val managedArticle = articleRepository.findById(article.id)
            .orElseThrow { EntityNotFoundException(com.example.researchreview.constants.ErrorCode.ARTICLE_NOT_FOUND.key) }

        topics.forEach { topic ->
            articleTopicRepository.save(
                ArticleTopic().apply {
                    this.article = managedArticle
                    this.topic = topic
                }
            )
        }
    }

    private fun resolveSubmissionTopics(conferenceId: String, trackId: String, topicIds: List<String>): List<Topic> {
        val normalizedTopicIds = topicIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        if (normalizedTopicIds.isEmpty()) {
            throw IllegalArgumentException("articles.atLeastOneTopicRequired")
        }

        val topics = topicRepository.findAllByIdInAndConferenceIdAndTrackIdAndDeletedFalse(
            ids = normalizedTopicIds,
            conferenceId = conferenceId,
            trackId = trackId,
        )

        if (topics.size != normalizedTopicIds.size) {
            throw IllegalArgumentException("articles.invalidTopicIdsForConferenceTrack")
        }
        if (topics.any { !it.isActive }) {
            throw IllegalArgumentException("articles.inactiveTopicsSelected")
        }

        return topics
    }

    private fun ensureConferenceOpenForSubmission(status: ConferenceStatus, submissionDeadline: LocalDateTime?) {
        if (status != ConferenceStatus.ACTIVE) {
            throw IllegalStateException("articles.submissionOnlyForActiveConference")
        }
        if (submissionDeadline != null && LocalDateTime.now().isAfter(submissionDeadline)) {
            throw IllegalStateException("articles.submissionDeadlinePassed")
        }
    }

    private fun persistAuthor(dto: AuthorDto): Author {
        val institutionId = dto.institution.id
        require(institutionId.isNotBlank()) { "articles.authorInstitutionIdRequired" }
        val institution = institutionRepository.findById(institutionId)
            .orElseThrow { EntityNotFoundException("institution.notFound") }
        
        // Resolve user: try explicit dto.user.id first, then search by email
        val user = dto.user?.id?.takeIf { it.isNotBlank() }?.let { id ->
            userRepository.findById(id).orElse(null)
        } ?: run {
            // Auto-search user by email if not explicitly provided
            userRepository.findByEmailIgnoreCase(dto.email).orElse(null)
        }
        
        val author = when {
            dto.id.isNotBlank() -> authorRepository.findById(dto.id).orElse(Author())
            else -> authorRepository.findByEmail(dto.email) ?: Author()
        }
        author.name = dto.name
        author.email = dto.email
        author.institution = institution
        author.user = user
        return authorRepository.save(author)
    }

    private fun resolveReviewer(dto: ReviewerRequestDto): Reviewer {
        val institutionId = dto.institutionId
        val institution = institutionRepository.findById(institutionId)
            .orElseThrow { EntityNotFoundException("institution.notFound") }
        val reviewer = reviewerRepository.findByEmail(dto.email) ?: Reviewer()
        reviewer.name = dto.name
        reviewer.email = dto.email
        reviewer.institution = institution
        val user = dto.userId?.takeIf { it.isNotBlank() }?.let { id ->
            userRepository.findById(id).orElse(null)
        } ?: userRepository.findByEmailIgnoreCase(dto.email).orElse(null)
        if (user != null) {
            val conferenceId = articleRepository.findByIdAndDeletedFalse(dto.articleId)
                .orElse(null)
                ?.conference?.id
            if (conferenceId != null) {
                ensureUserConferenceMembership(user, conferenceId, ConferenceMembershipRole.REVIEWER)
            }
            reviewer.user = user
        }
        return reviewerRepository.save(reviewer)
    }

    private fun ensureUserConferenceMembership(user: User, conferenceId: String, role: ConferenceMembershipRole) {
        val existing = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, user.id)
            .orElse(null)
        if (existing != null) {
            if (existing.membershipRole != role) {
                existing.membershipRole = role
                userConferenceMembershipRepository.save(existing)
            }
            return
        }

        val conference = conferenceRepository.findByIdAndDeletedFalse(conferenceId)
            .orElseThrow { EntityNotFoundException("conference.notFound") }

        userConferenceMembershipRepository.save(
            UserConferenceMembership().apply {
                this.user = user
                this.conference = conference
                this.membershipRole = role
            }
        )
    }

    private fun notifyArticleSubmitted(article: Article) {
        val recipients = gatherStakeholders(article, includeReviewers = false)
        dispatchArticleNotification(
            recipients,
            NotificationType.ARTICLE_SUBMITTED,
            payload = mapOf(
                "articleId" to article.id,
                "title" to article.title,
                "conferenceId" to article.conference?.id,
                "trackId" to article.track.id,
                "status" to article.status.name
            )
        )
    }

    private fun notifyArticleStatusChanged(article: Article, previousStatus: ArticleStatus?) {
        val recipients = gatherStakeholders(article)
        dispatchArticleNotification(
            recipients,
            NotificationType.ARTICLE_STATUS_CHANGED,
            payload = mapOf(
                "articleId" to article.id,
                "title" to article.title,
                "previousStatus" to previousStatus?.name,
                "currentStatus" to article.status.name
            )
        )
    }

    private fun notifyReviewerInvitation(relation: ReviewerArticle, isNewAssignment: Boolean = true) {
        // Only notify on first assignment or when status was revoked; don't re-notify if already ACCEPTED
        if (!isNewAssignment) {
            return
        }

        val reviewerEmail = relation.reviewer.email
        val articleTitle = relation.article.title
        val articleId = relation.article.id

        // Always create an invite token so the reviewer can confirm accept/decline after opening the link.
        val invitationToken = reviewerInviteService.createInvite(reviewerEmail, articleId)
        val inviteUrl = URIBuilder(frontendUrl)
            .setPath("/reviewer-invite")
            .addParameter("token", invitationToken)
            .build()
            .toString()

        // Always send email
        emailService.sendEmail(
            to = listOf(reviewerEmail),
            subject = "Lời mời phản biện bài báo: $articleTitle",
            message = """
                Xin chào ${relation.reviewer.name},

                Bạn được mời phản biện bài báo sau:

                Tiêu đề: $articleTitle

                Vui lòng truy cập link sau để xác nhận nhận lời/từ chối phản biện:
                $inviteUrl

                Link sẽ hết hạn sau 7 ngày.

                Trân trọng,
                Hệ thống Quản lý Nghiên cứu
            """.trimIndent(),
            template = "reviewer-invitation"
        )

        // Also send in-app notification if reviewer has a User account
        val reviewerUserId = relation.reviewer.user?.id?.takeIf { it.isNotBlank() }
        if (reviewerUserId != null) {
            notificationService.notifyUser(
                reviewerUserId,
                NotificationType.REVIEWER_INVITED,
                payload = mapOf(
                    "articleId" to relation.article.id,
                    "title" to relation.article.title,
                    "articleTitle" to relation.article.title,
                    "displayIndex" to relation.displayIndex,
                    "status" to relation.status.name,
                    "inviteUrl" to inviteUrl,
                    "token" to invitationToken
                ),
                contextId = relation.article.id,
                contextType = "ARTICLE"
            )
        }
    }

    private fun notifyReviewerRevocation(relation: ReviewerArticle) {
        val reviewerUserId = relation.reviewer.user?.id?.takeIf { it.isNotBlank() } ?: return
        notificationService.notifyUser(
            reviewerUserId,
            NotificationType.REVIEWER_REVOKED,
            payload = mapOf(
                "articleId" to relation.article.id,
                "title" to relation.article.title,
                "displayIndex" to relation.displayIndex
            ),
            contextId = relation.article.id,
            contextType = "ARTICLE"
        )
    }

    private fun gatherStakeholders(
        article: Article,
        includeAuthors: Boolean = true,
        includeEditors: Boolean = true,
        includeReviewers: Boolean = true
    ): Set<String> {
        val authorIds = if (includeAuthors) {
            articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
                .mapNotNull { it.author.user?.id?.takeIf { id -> id.isNotBlank() } }
        } else emptyList()
        val editorIds = if (includeEditors) {
            editorRepository.findAllByTrackIdAndDeletedFalse(article.track.id)
                .mapNotNull { it.user.id.takeIf { id -> id.isNotBlank() } }
        } else emptyList()
        val reviewerIds = if (includeReviewers) {
            reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)
                .mapNotNull { it.reviewer.user?.id?.takeIf { id -> id.isNotBlank() } }
        } else emptyList()
        return (authorIds + editorIds + reviewerIds).toSet()
    }

    private fun dispatchArticleNotification(
        recipients: Set<String>,
        type: NotificationType,
        payload: Map<String, Any?>
    ) {
        if (recipients.isEmpty()) {
            return
        }
        val actorId = currentUserService.currentUser()?.id
        val filtered = recipients.filter { it != actorId }
        if (filtered.isEmpty()) {
            return
        }
        notificationService.notifyUsers(
            filtered,
            type,
            payload = payload,
            contextId = payload["articleId"] as? String,
            contextType = "ARTICLE"
        )
    }

    private fun toDto(article: Article): ArticleDto {
        val authors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .sortedBy { it.authorOrder }
            .map(ArticleAuthor::author)
        val reviewers = reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map(ReviewerArticle::reviewer)
        val topicIds = articleTopicRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map { it.topic.id }
        return ArticleDto(
            id = article.id,
            title = article.title,
            abstract = article.abstract,
            conclusion = article.conclusion,
            link = article.link,
            conferenceId = article.conference?.id ?: "",
            conferenceName = article.conference?.name ?: "",
            track = TrackDto(
                id = article.track.id,
                name = article.track.name,
                editors = emptyList(),
                description = article.track.description,
                isActive = article.track.isActive,
                createdAt = article.track.createdAt,
                updatedAt = article.track.updatedAt,
                createdBy = article.track.createdBy,
                updatedBy = article.track.updatedBy
            ),
            topicIds = topicIds,
            status = article.status,
            initialReviewNote = article.initialReviewNote,
            initialReviewNextSteps = article.initialReviewNextSteps,
            authors = authors.map { authorToDto(it) },
            reviewers = reviewers.map { reviewerToDto(it) },
            createdAt = article.createdAt,
            updatedAt = article.updatedAt,
            createdBy = article.createdBy,
            updatedBy = article.updatedBy
        )
    }

    private fun authorToDto(author: Author): AuthorDto {
        return AuthorDto(
            id = author.id,
            name = author.name,
            email = author.email,
            institution = author.institution?.let {
                InstitutionDto(
                    id = it.id,
                    name = it.name,
                    country = it.country,
                    website = it.website,
                    logo = it.logo
                )
            } as InstitutionDto,
            user = author.user?.let { userToDto(it) },
            createdAt = author.createdAt,
            updatedAt = author.updatedAt,
            createdBy = author.createdBy,
            updatedBy = author.updatedBy
        )
    }

    private fun reviewerToDto(reviewer: Reviewer): ReviewerDto {
        return ReviewerDto(
            id = reviewer.id,
            name = reviewer.name,
            email = reviewer.email,
            institution = reviewer.institution?.let {
                InstitutionDto(
                    id = it.id,
                    name = it.name,
                    country = it.country,
                    website = it.website,
                    logo = it.logo
                )
            } as InstitutionDto,
            user = reviewer.user?.let { userToDto(it) },
            createdAt = reviewer.createdAt,
            updatedAt = reviewer.updatedAt,
            createdBy = reviewer.createdBy,
            updatedBy = reviewer.updatedBy
        )
    }

    private fun userToDto(user: com.example.researchreview.entities.User): com.example.researchreview.dtos.UserDto {
        return com.example.researchreview.dtos.UserDto(
            id = user.id,
            name = user.name,
            globalRole = user.globalRole.name,
            email = user.email,
            avatarId = user.avatarId,
            institution = user.institution?.let {
                InstitutionDto(
                    id = it.id,
                    name = it.name,
                    country = it.country,
                    website = it.website,
                    logo = it.logo
                )
            },
            track = user.track?.let {
                TrackDto(
                    id = it.id,
                    name = it.name,
                    editors = emptyList(),
                    description = it.description,
                    isActive = it.isActive,
                    createdAt = it.createdAt,
                    updatedAt = it.updatedAt,
                    createdBy = it.createdBy,
                    updatedBy = it.updatedBy
                )
            },
            gender = user.gender,
            nationality = user.nationality,
            academicStatus = user.academicStatus,
            status = user.status.name,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt,
            createdBy = user.createdBy,
            updatedBy = user.updatedBy
        )
    }

    private fun fetchArticle(id: String): Article = articleAccessGuard.fetchAccessibleArticle(id)

    @Transactional
    override fun startRevisions(id: String): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)

        // Verify user is an author of the article
        val articleAuthors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(id)
        val isAuthor = articleAuthors.any { aa ->
            aa.author.user?.id == currentUser.id
        }
        if (!isAuthor) {
            throw AccessDeniedException("articles.onlyAuthorsCanStartRevisions")
        }

        if (article.status == ArticleStatus.REVISIONS) {
            return toDto(article)
        }

        if (article.status != ArticleStatus.REVISIONS_REQUESTED) {
            throw IllegalStateException(
                "articles.startRevisionsOnlyWhenRequested"
            )
        }

        val previousStatus = article.status
        article.status = ArticleStatus.REVISIONS
        article.updatedAt = LocalDateTime.now()
        article.updatedBy = currentUser.email
        val updated = articleRepository.saveAndFlush(article)

        if (previousStatus != updated.status) {
            notifyArticleStatusChanged(updated, previousStatus)
        }

        return toDto(updated)
    }

    @Transactional
    override fun submitRevision(id: String, file: MultipartFile, notes: String?): ArticleDto {
        val currentUser = currentUserService.requireUser()
        val article = fetchArticle(id)

        // Verify user is an author of the article
        val articleAuthors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(id)
        val isAuthor = articleAuthors.any { aa ->
            aa.author.user?.id == currentUser.id
        }

        if (!isAuthor) {
            throw AccessDeniedException("articles.onlyAuthorsCanSubmitRevisions")
        }

        // Verify article status allows revision submission
        if (article.status != ArticleStatus.REVISIONS && article.status != ArticleStatus.REVISIONS_REQUESTED) {
            throw IllegalStateException(
                "articles.submitRevisionOnlyWhenAllowedStatus"
            )
        }

        // Validate file is PDF
        if (file.contentType != "application/pdf") {
            throw IllegalArgumentException("articles.onlyPdfAllowed")
        }

        // Determine next logical article version.
        // Version 1 is the initial submission review; revisions should increment to 2,3,...
        val maxExistingVersion = attachmentRepository.findAllByArticleIdAndDeletedFalse(id)
            .asSequence()
            .filter { it.status == com.example.researchreview.constants.AttachmentStatus.AVAILABLE }
            .filter { it.kind == AttachmentKind.SUBMISSION || it.kind == AttachmentKind.REVISION }
            .maxOfOrNull { it.version } ?: 0
        val nextVersion = kotlin.math.max(1, maxExistingVersion) + 1

        // Upload file as attachment (stored as a revision, does not overwrite article.link)
        val uploadedRevision = attachmentService.uploadAttachment(
            articleId = id,
            file = file,
            version = nextVersion,
            kind = AttachmentKind.REVISION
        )

        // Ensure article_version row exists and points to the uploaded main revision attachment.
        val revisionAttachment = attachmentRepository.findById(uploadedRevision.id)
            .orElseThrow { EntityNotFoundException("attachment.notFound") }

        val revisionVersion = articleVersionRepository
            .findByArticleIdAndVersionNumberAndDeletedFalse(id, nextVersion)
            .orElseGet {
                ArticleVersion().apply {
                    this.article = article
                    this.versionNumber = nextVersion
                }
            }
            .apply {
                this.mainAttachment = revisionAttachment
                this.submittedBy = currentUser
                this.submittedAt = LocalDateTime.now()
            }

        val savedRevisionVersion = articleVersionRepository.save(revisionVersion)
        revisionAttachment.articleVersion = savedRevisionVersion
        attachmentRepository.save(revisionAttachment)

        // After the author submits, review continues
        val previousStatus = article.status
        article.status = ArticleStatus.IN_REVIEW
        article.updatedAt = LocalDateTime.now()
        article.updatedBy = currentUser.email
        val updated = articleRepository.saveAndFlush(article)

        if (previousStatus != updated.status) {
            notifyArticleStatusChanged(updated, previousStatus)
        }

        // Optional extra notification for editors/reviewers
        notifyRevisionSubmitted(updated, currentUser.email ?: "Unknown", notes)

        return toDto(updated)
    }

    private fun notifyRevisionSubmitted(article: Article, authorEmail: String, notes: String?) {
        val recipients = gatherStakeholders(article, includeAuthors = false)
        dispatchArticleNotification(
            recipients,
            NotificationType.ARTICLE_REVISION_SUBMITTED,
            payload = mapOf(
                "articleId" to article.id,
                "title" to article.title,
                "authorEmail" to authorEmail,
                "notes" to notes
            )
        )
    }

    private fun sendSubmissionConfirmationEmail(article: Article) {
        val authorEmails = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map { it.author.email.trim() }
            .filter { it.isNotBlank() }
            .distinct()

        if (authorEmails.isEmpty()) {
            return
        }

        val subject = "[Research Review] Xác nhận nhận bài báo: ${article.title}"
        val articleUrl = "$frontendUrl/articles/${article.id}"
        val submissionDate = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
        val message = """
            <p>Xin chào tác giả,</p>
            <p>Cảm ơn bạn đã nộp bài báo cho hội nghị của chúng tôi!</p>
            <p>
                <strong>Tiêu đề bài báo:</strong> ${article.title}<br/>
                <strong>Hội nghị:</strong> ${article.conference?.name ?: "N/A"}<br/>
                <strong>Track/Chuyên đề:</strong> ${article.track.name}<br/>
                <strong>Thời gian nộp:</strong> $submissionDate<br/>
                <strong>Mã bài báo:</strong> ${article.id}
            </p>
            <p>
                Bạn có thể theo dõi trạng thái bài báo tại:<br/>
                <a href="$articleUrl">$articleUrl</a>
            </p>
            <p>
                Chúng tôi sẽ sớm kiểm soát bài báo của bạn. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với ban tổ chức.
            </p>
            <p>Trân trọng,<br/>Research Review</p>
        """.trimIndent()

        emailService.sendEmail(
            to = authorEmails,
            subject = subject,
            message = message,
            template = "submission-confirmation"
        )
    }

    private fun sendChairDecisionEmailToAuthors(article: Article, decisionStatus: ArticleStatus) {
        val authorEmails = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map { it.author.email.trim() }
            .filter { it.isNotBlank() }
            .distinct()

        if (authorEmails.isEmpty()) {
            return
        }

        val decisionLabel = when (decisionStatus) {
            ArticleStatus.ACCEPTED -> "CHẤP NHẬN"
            ArticleStatus.REJECTED -> "TỪ CHỐI"
            ArticleStatus.REVISIONS_REQUESTED -> "YÊU CẦU SỬA CHỮA"
            else -> return
        }

        val subject = "[Research Review] Kết quả quyết định cho bài báo: ${article.title}"
        val articleUrl = "$frontendUrl/articles/${article.id}"
        val message = """
            <p>Xin chào tác giả,</p>
            <p>Đã có quyết định chính thức cho bài báo của bạn.</p>
            <p>
                <strong>Tiêu đề:</strong> ${article.title}<br/>
                <strong>Quyết định:</strong> $decisionLabel
            </p>
            <p>
                Bạn có thể xem chi tiết tại:<br/>
                <a href="$articleUrl">$articleUrl</a>
            </p>
            <p>Trân trọng,<br/>Research Review</p>
        """.trimIndent()

        emailService.sendEmail(
            to = authorEmails,
            subject = subject,
            message = message,
            template = "chair-decision-notification"
        )
    }

    private fun ensureChairDecisionPermission(user: User, article: Article) {
        val conferenceId = article.conference?.id
            ?: throw IllegalStateException("articles.conferenceRequiredForDecisionPermission")

        val conferenceMembership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, user.id)
            .orElse(null)

        val hasChairMembership = conferenceMembership?.membershipRole == ConferenceMembershipRole.EDITOR
        if (!hasChairMembership) {
            throw AccessDeniedException("articles.onlyConferenceChairCanSendFinalDecisions")
        }
    }

    private fun ensureReviewerManagementPermission(user: User, article: Article) {
        val conferenceId = article.conference?.id
            ?: throw IllegalStateException("articles.conferenceRequiredForReviewerManagement")

        // Admins can always manage reviewers
        if (user.globalRole == GlobalRole.ADMIN) {
            return
        }

        // Conference editors (chairs) can manage reviewers
        val conferenceMembership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, user.id)
            .orElse(null)

        val hasEditorMembership = conferenceMembership?.membershipRole == ConferenceMembershipRole.EDITOR
        if (!hasEditorMembership) {
            throw AccessDeniedException("articles.onlyEditorCanManageReviewers")
        }
    }
}
