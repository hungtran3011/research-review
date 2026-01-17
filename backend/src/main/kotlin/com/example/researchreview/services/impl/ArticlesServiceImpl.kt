package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.InitialReviewDecision
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.AuthorDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ArticleAuthor
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.AuthorRepository
import com.example.researchreview.repositories.AttachmentRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.ArticlesService
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
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime

@Service
class ArticlesServiceImpl(
    private val articleRepository: ArticleRepository,
    private val trackRepository: TrackRepository,
    private val authorRepository: AuthorRepository,
    private val reviewerRepository: ReviewerRepository,
    private val articleAuthorRepository: ArticleAuthorRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val institutionRepository: InstitutionRepository,
    private val userRepository: UserRepository,
    private val editorRepository: EditorRepository,
    private val reviewerArticleManager: ReviewerArticleManager,
    private val articleAccessGuard: ArticleAccessGuard,
    private val notificationService: NotificationService,
    private val currentUserService: CurrentUserService,
    private val emailService: EmailService,
    private val reviewerInviteService: ReviewerInviteService,
    private val attachmentService: AttachmentService,
    private val attachmentRepository: AttachmentRepository
) : ArticlesService {

    @Value("\${custom.front-end-url}")
    private val frontendUrl: String = ""

    @Transactional(readOnly = true)
    override fun getAll(pageable: Pageable): Page<ArticleDto> {
        val page = articleAccessGuard.listAccessibleArticles(pageable)
        return page.map { toDto(it) }
    }

    @Transactional(readOnly = true)
    override fun getById(id: String): ArticleDto = toDto(fetchArticle(id))

    @Transactional
    override fun create(articleDto: ArticleRequestDto): ArticleDto {
        val currentUser = currentUserService.requireUser()
        if (!currentUser.hasRole(com.example.researchreview.constants.Role.RESEARCHER)) {
            throw AccessDeniedException("Only RESEARCHER can submit articles")
        }
        val track = trackRepository.findById(articleDto.trackId)
            .orElseThrow { EntityNotFoundException("Track not found with id ${articleDto.trackId}") }
        val article = Article().apply {
            title = articleDto.title
            abstract = articleDto.abstract
            conclusion = articleDto.conclusion
            link = articleDto.link
            this.track = track
            status = ArticleStatus.SUBMITTED
        }
        val saved = articleRepository.saveAndFlush(article)
        syncAuthors(saved, articleDto.authors)
        notifyArticleSubmitted(saved)
        return toDto(saved)
    }

    @Transactional
    override fun update(articleDto: ArticleRequestDto): ArticleDto {
        val articleId = articleDto.id ?: throw IllegalArgumentException("Article id is required for update")
        val article = fetchArticle(articleId)
        article.title = articleDto.title
        article.abstract = articleDto.abstract
        article.conclusion = articleDto.conclusion
        article.link = articleDto.link
        if (article.track.id != articleDto.trackId) {
            val track = trackRepository.findById(articleDto.trackId)
                .orElseThrow { EntityNotFoundException("Track not found with id ${articleDto.trackId}") }
            article.track = track
        }
        val saved = articleRepository.saveAndFlush(article)
        syncAuthors(saved, articleDto.authors)
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
        val article = fetchArticle(id)
        val reviewerEntity = resolveReviewer(reviewer)
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(article.id, reviewerEntity.id)
            ?: ReviewerArticle().apply {
                this.article = article
                this.reviewer = reviewerEntity
            }
        reviewerArticleManager.ensureDisplayIndexFor(relation)
        relation.deleted = false
        relation.status = ReviewerInvitationStatus.PENDING
        relation.invitedAt = LocalDateTime.now()
        val savedRelation = reviewerArticleRepository.save(relation)
        notifyReviewerInvitation(savedRelation)
        return toDto(article)
    }

    @Transactional
    override fun unassignReviewer(id: String, reviewerId: String): ArticleDto {
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(id, reviewerId)
            ?: throw EntityNotFoundException("Reviewer relation not found")
        relation.deleted = true
        val savedRelation = reviewerArticleRepository.save(relation)
        notifyReviewerRevocation(savedRelation)
        return getById(id)
    }

    @Transactional
    override fun reject(id: String) {
        updateStatus(id, ArticleStatus.REJECTED)
    }

    @Transactional
    override fun approve(id: String) {
        updateStatus(id, ArticleStatus.ACCEPTED)
    }

    @Transactional(readOnly = true)
    override fun getReviewers(id: String): List<ReviewerDto> =
        reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(id).map { reviewerToDto(it.reviewer) }

    @Transactional
    override fun requestRejection(id: String): ArticleDto {
        val article = fetchArticle(id)
        if (article.status != ArticleStatus.IN_REVIEW) {
            throw IllegalStateException("Rejection request is only allowed when article is IN_REVIEW")
        }
        updateStatus(id, ArticleStatus.REJECT_REQUESTED)
        return getById(id)
    }

    @Transactional
    override fun requestApproval(id: String): ArticleDto {
        val article = fetchArticle(id)
        if (article.status != ArticleStatus.IN_REVIEW) {
            throw IllegalStateException("Approval request is only allowed when article is IN_REVIEW")
        }
        updateStatus(id, ArticleStatus.ACCEPT_REQUESTED)
        return getById(id)
    }

    @Transactional
    override fun requestRevisions(id: String): ArticleDto {
        val article = fetchArticle(id)
        if (article.status != ArticleStatus.IN_REVIEW) {
            throw IllegalStateException("Revision request is only allowed when article is IN_REVIEW")
        }
        updateStatus(id, ArticleStatus.REVISIONS_REQUESTED)
        return getById(id)
    }

    @Transactional
    override fun initialReview(articleId: String, request: InitialReviewRequestDto): ArticleDto {
        val article = fetchArticle(articleId)
        val previousStatus = article.status
        if (previousStatus != ArticleStatus.SUBMITTED) {
            throw IllegalStateException("Initial review is only allowed when article is SUBMITTED")
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
            .orElseThrow { EntityNotFoundException("Article not found with id ${article.id}") }
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

    private fun persistAuthor(dto: AuthorDto): Author {
        val institutionId = dto.institution.id
        require(institutionId.isNotBlank()) { "Institution id is required for author ${dto.name}" }
        val institution = institutionRepository.findById(institutionId)
            .orElseThrow { EntityNotFoundException("Institution not found with id $institutionId") }
        
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
            .orElseThrow { EntityNotFoundException("Institution not found with id $institutionId") }
        val reviewer = reviewerRepository.findByEmail(dto.email) ?: Reviewer()
        reviewer.name = dto.name
        reviewer.email = dto.email
        reviewer.institution = institution
        if (!dto.userId.isNullOrBlank()) {
            reviewer.user = userRepository.findById(dto.userId!!).orElse(reviewer.user)
        }
        return reviewerRepository.save(reviewer)
    }

    private fun notifyArticleSubmitted(article: Article) {
        val recipients = gatherStakeholders(article, includeReviewers = false)
        dispatchArticleNotification(
            recipients,
            NotificationType.ARTICLE_SUBMITTED,
            payload = mapOf(
                "articleId" to article.id,
                "title" to article.title,
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

    private fun notifyReviewerInvitation(relation: ReviewerArticle) {
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
        return ArticleDto(
            id = article.id,
            title = article.title,
            abstract = article.abstract,
            conclusion = article.conclusion,
            link = article.link,
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
            role = user.role.name,
            roles = user.effectiveRoles.map { it.name },
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
            throw AccessDeniedException("Only article authors can start revisions")
        }

        if (article.status == ArticleStatus.REVISIONS) {
            return toDto(article)
        }

        if (article.status != ArticleStatus.REVISIONS_REQUESTED) {
            throw IllegalStateException(
                "Starting revisions is only allowed when article is REVISIONS_REQUESTED. Current status: ${article.status}"
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
            throw AccessDeniedException("Only article authors can submit revisions")
        }

        // Verify article status allows revision submission
        if (article.status != ArticleStatus.REVISIONS && article.status != ArticleStatus.REVISIONS_REQUESTED) {
            throw IllegalStateException(
                "Revision submission is only allowed when article is REVISIONS or REVISIONS_REQUESTED. Current status: ${article.status}"
            )
        }

        // Validate file is PDF
        if (file.contentType != "application/pdf") {
            throw IllegalArgumentException("Only PDF files are allowed")
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
        attachmentService.uploadAttachment(
            articleId = id,
            file = file,
            version = nextVersion,
            kind = AttachmentKind.REVISION
        )

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
}
