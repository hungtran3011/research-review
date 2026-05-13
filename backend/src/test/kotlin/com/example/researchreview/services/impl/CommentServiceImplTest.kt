package com.example.researchreview.services.impl

import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.Comment
import com.example.researchreview.entities.CommentThread
import com.example.researchreview.entities.Editor
import com.example.researchreview.entities.Track
import com.example.researchreview.entities.User
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.CommentRepository
import com.example.researchreview.repositories.CommentThreadRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.ReviewerArticleManager
import jakarta.persistence.EntityNotFoundException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.security.access.AccessDeniedException
import java.util.Optional

class CommentServiceImplTest {

    private val commentThreadRepository: CommentThreadRepository = mock()
    private val commentRepository: CommentRepository = mock()
    private val currentUserService: CurrentUserService = mock()
    private val articleAccessGuard: ArticleAccessGuard = mock()
    private val reviewerArticleManager: ReviewerArticleManager = mock()
    private val notificationService: NotificationService = mock()
    private val articleAuthorRepository: ArticleAuthorRepository = mock()
    private val editorRepository: EditorRepository = mock()
    private val reviewerArticleRepository: ReviewerArticleRepository = mock()
    private val reviewerRepository: ReviewerRepository = mock()

    private lateinit var service: CommentServiceImpl

    @BeforeEach
    fun setUp() {
        service = CommentServiceImpl(
            commentThreadRepository = commentThreadRepository,
            commentRepository = commentRepository,
            currentUserService = currentUserService,
            articleAccessGuard = articleAccessGuard,
            reviewerArticleManager = reviewerArticleManager,
            notificationService = notificationService,
            articleAuthorRepository = articleAuthorRepository,
            editorRepository = editorRepository,
            reviewerArticleRepository = reviewerArticleRepository,
            reviewerRepository = reviewerRepository,
        )
    }

    @Test
    fun `deleteComment allows the comment owner to delete their comment`() {
        val owner = user("u-owner", GlobalRole.USER)
        val article = article("a-1", "t-1")
        val thread = thread("th-1", article)
        val comment = comment("c-1", thread, createdBy = owner.id, authorId = owner.id)

        whenever(currentUserService.currentUser()).thenReturn(owner)
        whenever(articleAccessGuard.fetchAccessibleArticle(article.id)).thenReturn(article)
        whenever(commentRepository.findById(comment.id)).thenReturn(Optional.of(comment))
        whenever(articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)).thenReturn(emptyList())
        whenever(editorRepository.findAllByUserIdAndDeletedFalse(owner.id)).thenReturn(emptyList())
        whenever(editorRepository.findAllByTrackIdAndDeletedFalse(article.track.id)).thenReturn(emptyList())
        whenever(reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)).thenReturn(emptyList())
        whenever(reviewerRepository.findByUserId(owner.id)).thenReturn(null)
        whenever(reviewerArticleManager.reviewerLabels(article.id)).thenReturn(emptyMap())
        whenever(commentRepository.save(any<Comment>())).thenAnswer { it.arguments[0] as Comment }

        val updated = service.deleteComment(comment.id)

        assertEquals(thread.id, updated.id)
        assertEquals(0, updated.comments.size)
        verify(commentRepository).save(comment)
    }

    @Test
    fun `deleteComment denies editor when comment is not owned`() {
        val editorUser = user("u-editor", GlobalRole.USER)
        val article = article("a-2", "t-2")
        val thread = thread("th-2", article)
        val comment = comment("c-2", thread, createdBy = "u-other", authorId = "u-other")
        val editor = editor(editorUser, article.track)

        whenever(currentUserService.currentUser()).thenReturn(editorUser)
        whenever(articleAccessGuard.fetchAccessibleArticle(article.id)).thenReturn(article)
        whenever(commentRepository.findById(comment.id)).thenReturn(Optional.of(comment))
        whenever(editorRepository.findAllByUserIdAndDeletedFalse(editorUser.id)).thenReturn(listOf(editor))
        whenever(reviewerRepository.findByUserId(editorUser.id)).thenReturn(null)

        assertThrows(AccessDeniedException::class.java) {
            service.deleteComment(comment.id)
        }
    }

    @Test
    fun `deleteComment denies admin when comment is not owned`() {
        val admin = user("u-admin", GlobalRole.ADMIN)
        val article = article("a-3", "t-3")
        val thread = thread("th-3", article)
        val comment = comment("c-3", thread, createdBy = "u-other", authorId = "u-other")

        whenever(currentUserService.currentUser()).thenReturn(admin)
        whenever(articleAccessGuard.fetchAccessibleArticle(article.id)).thenReturn(article)
        whenever(commentRepository.findById(comment.id)).thenReturn(Optional.of(comment))
        whenever(editorRepository.findAllByUserIdAndDeletedFalse(admin.id)).thenReturn(emptyList())
        whenever(reviewerRepository.findByUserId(admin.id)).thenReturn(null)

        assertThrows(AccessDeniedException::class.java) {
            service.deleteComment(comment.id)
        }
    }

    @Test
    fun `deleteComment denies non owner when comment belongs to another user`() {
        val viewer = user("u-viewer", GlobalRole.USER)
        val article = article("a-4", "t-4")
        val thread = thread("th-4", article)
        val comment = comment("c-4", thread, createdBy = "u-other", authorId = "u-other")

        whenever(currentUserService.currentUser()).thenReturn(viewer)
        whenever(articleAccessGuard.fetchAccessibleArticle(article.id)).thenReturn(article)
        whenever(commentRepository.findById(comment.id)).thenReturn(Optional.of(comment))
        whenever(editorRepository.findAllByUserIdAndDeletedFalse(viewer.id)).thenReturn(emptyList())
        whenever(reviewerRepository.findByUserId(viewer.id)).thenReturn(null)

        assertThrows(AccessDeniedException::class.java) {
            service.deleteComment(comment.id)
        }
    }

    @Test
    fun `deleteComment throws not found when comment is missing`() {
        val viewer = user("u-viewer-2", GlobalRole.USER)

        whenever(currentUserService.currentUser()).thenReturn(viewer)
        whenever(commentRepository.findById("missing")).thenReturn(Optional.empty())

        assertThrows(EntityNotFoundException::class.java) {
            service.deleteComment("missing")
        }
    }

    private fun user(id: String, role: GlobalRole): User {
        return User().apply {
            this.id = id
            this.name = id
            this.email = "$id@example.com"
            this.globalRole = role
        }
    }

    private fun article(id: String, trackId: String): Article {
        return Article().apply {
            this.id = id
            this.title = id
            this.track = Track().apply {
                this.id = trackId
                this.name = trackId
            }
        }
    }

    private fun thread(id: String, article: Article): CommentThread {
        return CommentThread().apply {
            this.id = id
            this.article = article
        }
    }

    private fun comment(id: String, thread: CommentThread, createdBy: String, authorId: String): Comment {
        return Comment().apply {
            this.id = id
            this.thread = thread
            this.content = "test"
            this.authorName = "author"
            this.createdBy = createdBy
            this.authorId = authorId
            thread.comments.add(this)
        }
    }

    private fun editor(user: User, track: Track): Editor {
        return Editor().apply {
            this.user = user
            this.track = track
        }
    }
}