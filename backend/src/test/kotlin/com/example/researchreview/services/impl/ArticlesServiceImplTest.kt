package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.constants.InitialReviewDecision
import com.example.researchreview.configs.FeatureFlagsProperties
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.User
import com.example.researchreview.entities.Track
import com.example.researchreview.entities.Editor
import com.example.researchreview.repositories.*
import com.example.researchreview.services.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.security.access.AccessDeniedException
import java.util.Optional

class ArticlesServiceImplTest {

    private val articleRepository: ArticleRepository = mock()
    private val conferenceRepository: ConferenceRepository = mock()
    private val trackRepository: TrackRepository = mock()
    private val topicRepository: TopicRepository = mock()
    private val articleTopicRepository: ArticleTopicRepository = mock()
    private val authorRepository: AuthorRepository = mock()
    private val reviewerRepository: ReviewerRepository = mock()
    private val articleAuthorRepository: ArticleAuthorRepository = mock()
    private val reviewerArticleRepository: ReviewerArticleRepository = mock()
    private val institutionRepository: InstitutionRepository = mock()
    private val userRepository: UserRepository = mock()
    private val editorRepository: EditorRepository = mock()
    private val reviewerArticleManager: ReviewerArticleManager = mock()
    private val articleAccessGuard: ArticleAccessGuard = mock()
    private val notificationService: NotificationService = mock()
    private val currentUserService: CurrentUserService = mock()
    private val emailService: EmailService = mock()
    private val reviewerInviteService: ReviewerInviteService = mock()
    private val attachmentService: AttachmentService = mock()
    private val attachmentRepository: AttachmentRepository = mock()
    private val structuredReviewRepository: StructuredReviewRepository = mock()
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository = mock()
    private val featureFlagsProperties: FeatureFlagsProperties = mock()
    private val conferenceAuthorizationService: ConferenceAuthorizationService = mock()
    private val articleVersionRepository: ArticleVersionRepository = mock()

    private lateinit var service: ArticlesServiceImpl

    @BeforeEach
    fun setUp() {
        service = spy(ArticlesServiceImpl(
            articleRepository,
            conferenceRepository,
            trackRepository,
            topicRepository,
            articleTopicRepository,
            articleVersionRepository,
            authorRepository,
            reviewerRepository,
            articleAuthorRepository,
            reviewerArticleRepository,
            institutionRepository,
            userRepository,
            editorRepository,
            reviewerArticleManager,
            articleAccessGuard,
            conferenceAuthorizationService,
            notificationService,
            currentUserService,
            emailService,
            reviewerInviteService,
            attachmentService,
            attachmentRepository,
            structuredReviewRepository,
            userConferenceMembershipRepository,
            featureFlagsProperties
        ))
    }

    @Test
    fun `initialReview should change status from SUBMITTED to PENDING_REVIEW when decision is SEND_TO_REVIEW`() {
        // Arrange
        val articleId = "a-1"
        val article = Article().apply {
            id = articleId
            status = ArticleStatus.SUBMITTED
            conference = Conference().apply { id = "c-1"; name = "C1"; shortName = "C1" }
            track = Track().apply { id = "t-1"; name = "Track 1" }
        }
        whenever(articleAccessGuard.fetchAccessibleArticle(articleId)).thenReturn(article)
        whenever(articleRepository.save(any<Article>())).thenAnswer { it.arguments[0] as Article }

        val request = InitialReviewRequestDto(
            decision = InitialReviewDecision.SEND_TO_REVIEW,
            note = "Looks good",
            nextSteps = "Invite reviewers"
        )

        // Act
        service.initialReview(articleId, request)

        // Assert
        assertEquals(ArticleStatus.PENDING_REVIEW, article.status)
        assertEquals("Looks good", article.initialReviewNote)
        verify(articleRepository).save(article)
    }

    @Test
    fun `initialReview should change status from SUBMITTED to REJECTED when decision is REJECT`() {
        // Arrange
        val articleId = "a-1"
        val article = Article().apply {
            id = articleId
            status = ArticleStatus.SUBMITTED
            conference = Conference().apply { id = "c-1"; name = "C1"; shortName = "C1" }
            track = Track().apply { id = "t-1"; name = "Track 1" }
        }
        whenever(articleAccessGuard.fetchAccessibleArticle(articleId)).thenReturn(article)
        whenever(articleRepository.save(any<Article>())).thenAnswer { it.arguments[0] as Article }

        val request = InitialReviewRequestDto(
            decision = InitialReviewDecision.REJECT,
            note = "Out of scope",
            nextSteps = "None"
        )

        // Act
        service.initialReview(articleId, request)

        // Assert
        assertEquals(ArticleStatus.REJECTED, article.status)
        verify(articleRepository).save(article)
    }

    @Test
    fun `create should deny submission when user is not registered to conference`() {
        val user = standardUser("u-submit", "submit@example.com")
        val conference = Conference().apply {
            id = "c-submit"
            name = "Conference"
            shortName = "CONF"
            status = ConferenceStatus.ACTIVE
        }
        val request = ArticleRequestDto(
            title = "Paper",
            abstract = "Abstract",
            conclusion = "Conclusion",
            conferenceId = conference.id,
            trackId = "track-1",
            topicIds = listOf("topic-1"),
            authors = emptyList(),
        )

        whenever(currentUserService.requireUser()).thenReturn(user)
        whenever(conferenceRepository.findByIdAndDeletedFalse(conference.id)).thenReturn(Optional.of(conference))
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse(conference.id, user.id)
        ).thenReturn(Optional.empty())

        assertThrows(AccessDeniedException::class.java) {
            service.create(request)
        }

        verify(trackRepository, never()).findByIdAndConferenceIdAndDeletedFalse(any(), any())
        verify(userConferenceMembershipRepository, never()).save(any())
    }

    @Test
    fun `markReviewsCompleted should change status to REVIEWS_COMPLETED when threshold reached`() {
        // Arrange
        val articleId = "a-1"
        val trackEntity = Track().apply { reviewPolicyMinCompletedReviews = 2 }
        val article = Article().apply {
            id = articleId
            status = ArticleStatus.IN_REVIEW
            track = trackEntity
        }
        whenever(articleAccessGuard.fetchAccessibleArticle(articleId)).thenReturn(article)
        whenever(featureFlagsProperties.reviewThresholdGateEnabled).thenReturn(true)
        whenever(structuredReviewRepository.countByReviewerArticleArticleIdAndReviewerArticleStatusAndSubmittedAtIsNotNullAndDeletedFalse(any(), any()))
            .thenReturn(2L)
        whenever(articleRepository.save(any<Article>())).thenAnswer { it.arguments[0] as Article }

        // Act
        service.markReviewsCompleted(articleId)

        // Assert
        assertEquals(ArticleStatus.REVIEWS_COMPLETED, article.status)
        verify(articleRepository).save(article)
    }

    @Test
    fun `markReviewsCompleted should throw exception when threshold not reached`() {
        // Arrange
        val articleId = "a-1"
        val trackEntity = Track().apply { reviewPolicyMinCompletedReviews = 3 }
        val article = Article().apply {
            id = articleId
            status = ArticleStatus.IN_REVIEW
            track = trackEntity
        }
        whenever(articleAccessGuard.fetchAccessibleArticle(articleId)).thenReturn(article)
        whenever(featureFlagsProperties.reviewThresholdGateEnabled).thenReturn(true)
        whenever(structuredReviewRepository.countByReviewerArticleArticleIdAndReviewerArticleStatusAndSubmittedAtIsNotNullAndDeletedFalse(any(), any()))
            .thenReturn(2L)

        // Act & Assert
        val exception = assertThrows(IllegalStateException::class.java) {
            service.markReviewsCompleted(articleId)
        }
        assertTrue(exception.message!!.contains("reviewThreshold"))
    }

    @Test
    fun `approve should change status to ACCEPTED when current status is REVIEWS_COMPLETED`() {
        // Arrange
        val articleId = "a-1"
        val user = com.example.researchreview.entities.User().apply { id = "u-1" }
        val article = Article().apply {
            id = articleId
            status = ArticleStatus.REVIEWS_COMPLETED
            conference = Conference().apply { id = "c-1" }
            track = Track().apply { id = "t-1" }
        }
        whenever(currentUserService.requireUser()).thenReturn(user)
        whenever(articleAccessGuard.fetchAccessibleArticle(articleId)).thenReturn(article)
        whenever(articleRepository.save(any<Article>())).thenAnswer { it.arguments[0] as Article }
        whenever(userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-1", "u-1"))
            .thenReturn(Optional.of(com.example.researchreview.entities.UserConferenceMembership().apply {
                this.user = user
                this.conference = Conference().apply { id = "c-1"; name = "C1"; shortName = "C1" }
                this.membershipRole = com.example.researchreview.constants.ConferenceMembershipRole.EDITOR
            }))
        whenever(editorRepository.findByUserIdAndTrackIdAndDeletedFalse(any<String>(), any<String>())).thenReturn(Optional.of(Editor()))

        // Act
        service.approve(articleId)

        // Assert
        assertEquals(ArticleStatus.ACCEPTED, article.status)
        verify(articleRepository).save(article)
    }

    private fun standardUser(id: String, email: String): User {
        return User().apply {
            this.id = id
            this.email = email
            this.name = id
            this.globalRole = GlobalRole.USER
        }
    }
}
