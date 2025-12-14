package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.InitialReviewDecision
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.AuthorDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ArticleAuthor
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.mappers.ArticleMapper
import com.example.researchreview.mappers.AuthorMapper
import com.example.researchreview.mappers.ReviewerMapper
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.AuthorRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.ArticlesService
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.ReviewerArticleManager
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
    private val articleMapper: ArticleMapper,
    private val authorMapper: AuthorMapper,
    private val reviewerMapper: ReviewerMapper,
    private val reviewerArticleManager: ReviewerArticleManager,
    private val articleAccessGuard: ArticleAccessGuard,
    private val notificationService: NotificationService,
    private val currentUserService: CurrentUserService
) : ArticlesService {

    @Transactional(readOnly = true)
    override fun getAll(pageable: Pageable): Page<ArticleDto> {
        val page = articleAccessGuard.listAccessibleArticles(pageable)
        return page.map { toDto(it) }
    }

    @Transactional(readOnly = true)
    override fun getById(id: String): ArticleDto = toDto(fetchArticle(id))

    @Transactional
    override fun create(articleDto: ArticleRequestDto): ArticleDto {
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
        val saved = articleRepository.save(article)
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
        val saved = articleRepository.save(article)
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
    reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(id).map { reviewerMapper.toDto(it.reviewer) }

    @Transactional
    override fun requestRejection(id: String) {
        updateStatus(id, ArticleStatus.REJECT_REQUESTED)
    }

    @Transactional
    override fun requestApproval(id: String) {
        updateStatus(id, ArticleStatus.PENDING_REVIEW)
    }

    @Transactional
    override fun initialReview(articleId: String, request: InitialReviewRequestDto): ArticleDto {
        val article = fetchArticle(articleId)
        val previousStatus = article.status
        article.initialReviewNote = request.note
        article.initialReviewNextSteps = request.nextSteps
        article.status = when (request.decision) {
            InitialReviewDecision.SEND_TO_REVIEW -> ArticleStatus.PENDING_REVIEW
            InitialReviewDecision.REQUEST_CHANGES -> ArticleStatus.REJECT_REQUESTED
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

    private fun toDto(article: Article): ArticleDto {
        val authors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .sortedBy { it.authorOrder }
            .map(ArticleAuthor::author)
        val reviewers = reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map(ReviewerArticle::reviewer)
        return articleMapper.toDto(article, authors, reviewers)
    }

    private fun fetchArticle(id: String): Article = articleAccessGuard.fetchAccessibleArticle(id)

    private fun syncAuthors(article: Article, authors: List<AuthorDto>) {
        val existing = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
        existing.forEach {
            it.deleted = true
            articleAuthorRepository.save(it)
        }
        authors.forEachIndexed { index, dto ->
            val savedAuthor = persistAuthor(dto)
            val relation = ArticleAuthor().apply {
                this.article = article
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
        val user = dto.user?.id?.takeIf { it.isNotBlank() }?.let { id ->
            userRepository.findById(id).orElse(null)
        }
        val author = when {
            dto.id.isNotBlank() -> authorRepository.findById(dto.id).orElse(Author())
            else -> authorRepository.findByEmail(dto.email) ?: Author()
        }
        return authorRepository.save(authorMapper.apply(author, dto, institution, user))
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
        val reviewerUserId = relation.reviewer.user?.id?.takeIf { it.isNotBlank() } ?: return
        notificationService.notifyUser(
            reviewerUserId,
            NotificationType.REVIEWER_INVITED,
            payload = mapOf(
                "articleId" to relation.article.id,
                "title" to relation.article.title,
                "displayIndex" to relation.displayIndex,
                "status" to relation.status.name
            ),
            contextId = relation.article.id,
            contextType = "ARTICLE"
        )
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
}
