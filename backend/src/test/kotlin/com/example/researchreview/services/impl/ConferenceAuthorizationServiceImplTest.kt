package com.example.researchreview.services.impl

import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.entities.User
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.CurrentUserService
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.security.access.AccessDeniedException
import java.util.Optional

class ConferenceAuthorizationServiceImplTest {

    private val currentUserService: CurrentUserService = mock()
    private val userRepository: UserRepository = mock()
    private val articleRepository: ArticleRepository = mock()
    private val reviewerArticleRepository: ReviewerArticleRepository = mock()
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository = mock()

    private lateinit var service: ConferenceAuthorizationServiceImpl

    @BeforeEach
    fun setUp() {
        service = ConferenceAuthorizationServiceImpl(
            currentUserService = currentUserService,
            userRepository = userRepository,
            articleRepository = articleRepository,
            reviewerArticleRepository = reviewerArticleRepository,
            userConferenceMembershipRepository = userConferenceMembershipRepository,
        )
    }

    @Test
    fun `canSubmit returns true when participant membership exists`() {
        val user = standardUser("u-1", "u1@example.com")
        whenever(currentUserService.currentUser()).thenReturn(user)
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-1", "u-1")
        ).thenReturn(Optional.of(membership(user, "c-1", ConferenceMembershipRole.RESEARCHER)))

        val allowed = service.canSubmit("c-1")

        assertTrue(allowed)
    }

    @Test
    fun `canSubmit returns false when user has no conference membership`() {
        val user = standardUser("u-1", "u1@example.com")
        whenever(currentUserService.currentUser()).thenReturn(user)
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-2", "u-1")
        ).thenReturn(Optional.empty())

        val allowed = service.canSubmit("c-2")

        assertFalse(allowed)
    }

    @Test
    fun `canManageReview returns true when editor membership exists`() {
        val user = standardUser("u-2", "editor@example.com")
        val article = article("a-1", "c-7")
        whenever(currentUserService.currentUser()).thenReturn(user)
        whenever(articleRepository.findByIdAndDeletedFalse("a-1")).thenReturn(Optional.of(article))
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-7", "u-2")
        ).thenReturn(Optional.of(membership(user, "c-7", ConferenceMembershipRole.EDITOR)))

        val allowed = service.canManageReview("a-1")

        assertTrue(allowed)
    }

    @Test
    fun `canFinalizeDecision returns true for editor and false for researcher`() {
        val article = article("a-3", "c-9")
        whenever(articleRepository.findByIdAndDeletedFalse("a-3")).thenReturn(Optional.of(article))

        val editor = standardUser("u-editor", "editor@example.com")
        whenever(currentUserService.currentUser()).thenReturn(editor)
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-9", "u-editor")
        ).thenReturn(Optional.of(membership(editor, "c-9", ConferenceMembershipRole.EDITOR)))

        assertTrue(service.canFinalizeDecision("a-3"))

        val researcher = standardUser("u-researcher", "researcher@example.com")
        whenever(currentUserService.currentUser()).thenReturn(researcher)
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-9", "u-researcher")
        ).thenReturn(Optional.of(membership(researcher, "c-9", ConferenceMembershipRole.RESEARCHER)))

        assertFalse(service.canFinalizeDecision("a-3"))
    }

    @Test
    fun `canSubmitStructuredReview returns true when invite accepted and conference membership exists`() {
        val user = standardUser("u-reviewer", "reviewer@example.com")
        val article = article("a-5", "c-11")
        val relation = reviewerRelation(user, article, ReviewerInvitationStatus.ACCEPTED)

        whenever(currentUserService.currentUser()).thenReturn(user)
        whenever(
            reviewerArticleRepository.findByArticleIdAndReviewerUserIdOrEmail("a-5", "u-reviewer", "reviewer@example.com")
        ).thenReturn(Optional.of(relation))
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-11", "u-reviewer")
        ).thenReturn(Optional.of(membership(user, "c-11", ConferenceMembershipRole.REVIEWER)))

        val allowed = service.canSubmitStructuredReview("a-5")

        assertTrue(allowed)
    }

    @Test
    fun `canManageReview returns true for global admin without conference membership`() {
        val admin = adminUser("u-admin", "admin@example.com")
        val article = article("a-6", "c-17")
        whenever(currentUserService.currentUser()).thenReturn(admin)
        whenever(articleRepository.findByIdAndDeletedFalse("a-6")).thenReturn(Optional.of(article))

        val allowed = service.canManageReview("a-6")

        assertTrue(allowed)
    }

    @Test
    fun `requireCanManageReview throws access denied when unauthorized`() {
        val user = standardUser("u-deny", "deny@example.com")
        val article = article("a-7", "c-22")
        whenever(currentUserService.currentUser()).thenReturn(user)
        whenever(articleRepository.findByIdAndDeletedFalse("a-7")).thenReturn(Optional.of(article))
        whenever(
            userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-22", "u-deny")
        ).thenReturn(Optional.empty())

        assertThrows(AccessDeniedException::class.java) {
            service.requireCanManageReview(articleId = "a-7", endpoint = "/api/v1/articles/{id}/reviewers")
        }
    }

    private fun standardUser(id: String, email: String): User {
        return User().apply {
            this.id = id
            this.email = email
            this.name = id
            this.globalRole = GlobalRole.USER
        }
    }

    private fun adminUser(id: String, email: String): User {
        val user = standardUser(id, email)
        user.globalRole = GlobalRole.ADMIN
        return user
    }

    private fun article(id: String, conferenceId: String): Article {
        val conference = Conference().apply {
            this.id = conferenceId
            this.name = conferenceId
            this.shortName = conferenceId
        }
        return Article().apply {
            this.id = id
            this.title = id
            this.conference = conference
        }
    }

    private fun membership(user: User, conferenceId: String, role: ConferenceMembershipRole): UserConferenceMembership {
        val conference = Conference().apply {
            this.id = conferenceId
            this.name = conferenceId
            this.shortName = conferenceId
        }
        return UserConferenceMembership().apply {
            this.user = user
            this.conference = conference
            this.membershipRole = role
        }
    }

    private fun reviewerRelation(user: User, article: Article, status: ReviewerInvitationStatus): ReviewerArticle {
        val reviewer = Reviewer().apply {
            this.user = user
            this.email = user.email
            this.name = user.name
        }
        return ReviewerArticle().apply {
            this.article = article
            this.reviewer = reviewer
            this.status = status
        }
    }
}
