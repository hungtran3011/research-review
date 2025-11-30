package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.InitialReviewDecision
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
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.ArticlesService
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
    private val articleMapper: ArticleMapper,
    private val authorMapper: AuthorMapper,
    private val reviewerMapper: ReviewerMapper
) : ArticlesService {

    @Transactional(readOnly = true)
    override fun getAll(pageable: Pageable): Page<ArticleDto> {
        val page = articleRepository.findAllByDeletedFalse(pageable)
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
        relation.deleted = false
        relation.status = ReviewerInvitationStatus.PENDING
        relation.invitedAt = LocalDateTime.now()
        reviewerArticleRepository.save(relation)
        return toDto(article)
    }

    @Transactional
    override fun unassignReviewer(id: String, reviewerId: String): ArticleDto {
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(id, reviewerId)
            ?: throw EntityNotFoundException("Reviewer relation not found")
        relation.deleted = true
        reviewerArticleRepository.save(relation)
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
        article.initialReviewNote = request.note
        article.initialReviewNextSteps = request.nextSteps
        article.status = when (request.decision) {
            InitialReviewDecision.SEND_TO_REVIEW -> ArticleStatus.PENDING_REVIEW
            InitialReviewDecision.REQUEST_CHANGES -> ArticleStatus.REJECT_REQUESTED
            InitialReviewDecision.REJECT -> ArticleStatus.REJECTED
        }
        val saved = articleRepository.save(article)
        return toDto(saved)
    }

    private fun updateStatus(id: String, status: ArticleStatus) {
        val article = fetchArticle(id)
        article.status = status
        articleRepository.save(article)
    }

    private fun toDto(article: Article): ArticleDto {
        val authors = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .sortedBy { it.authorOrder }
            .map(ArticleAuthor::author)
        val reviewers = reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .map(ReviewerArticle::reviewer)
        return articleMapper.toDto(article, authors, reviewers)
    }

    private fun fetchArticle(id: String): Article =
        articleRepository.findByIdAndDeletedFalse(id)
            .orElseThrow { EntityNotFoundException("Article not found with id $id") }

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
}
