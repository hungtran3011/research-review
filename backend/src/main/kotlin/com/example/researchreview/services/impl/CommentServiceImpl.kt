package com.example.researchreview.services.impl

import com.example.researchreview.constants.CommentStatus
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.dtos.CommentCreateRequestDto
import com.example.researchreview.dtos.CommentDto
import com.example.researchreview.dtos.CommentReplyRequestDto
import com.example.researchreview.dtos.CommentStatusUpdateRequestDto
import com.example.researchreview.dtos.CommentThreadDto
import com.example.researchreview.entities.Comment
import com.example.researchreview.entities.CommentThread
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.User
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.CommentRepository
import com.example.researchreview.repositories.CommentThreadRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.CommentService
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.example.researchreview.services.ReviewerArticleManager
import jakarta.persistence.EntityNotFoundException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CommentServiceImpl(
    private val commentThreadRepository: CommentThreadRepository,
    private val commentRepository: CommentRepository,
    private val currentUserService: CurrentUserService,
    private val articleAccessGuard: ArticleAccessGuard,
    private val reviewerArticleManager: ReviewerArticleManager,
    private val notificationService: NotificationService,
    private val articleAuthorRepository: ArticleAuthorRepository,
    private val editorRepository: EditorRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val reviewerRepository: ReviewerRepository
) : CommentService {

    private fun shouldMaskReviewerIdentity(viewer: User?): Boolean {
        if (viewer == null) return false
        if (viewer.hasRole(Role.ADMIN) || viewer.hasRole(Role.EDITOR)) return false
        // Preserve old behavior: researchers should not see reviewer identity.
        // If a user is both REVIEWER and RESEARCHER, do not mask.
        return viewer.hasRole(Role.RESEARCHER) && !viewer.hasRole(Role.REVIEWER)
    }

    @Transactional(readOnly = true)
    override fun listThreads(articleId: String): List<CommentThreadDto> {
        articleAccessGuard.fetchAccessibleArticle(articleId)
        val viewer = currentUserService.currentUser()
        val reviewerLabels = reviewerArticleManager.reviewerLabels(articleId)
        val threads = commentThreadRepository.findAllByArticleId(articleId)
            // Reviewers can only see their own comment threads
            val filtered = when {
                viewer?.hasRole(Role.REVIEWER) == true && !viewer.hasRole(Role.ADMIN) && !viewer.hasRole(Role.EDITOR) ->
                    threads.filter { thread -> threadBelongsToReviewer(thread, viewer.id) }
                else -> threads
            }
        val maskReviewer = shouldMaskReviewerIdentity(viewer)
            return filtered.map { it.toDto(maskReviewer, reviewerLabels) }
    }

    @Transactional
    override fun createThread(articleId: String, request: CommentCreateRequestDto): CommentThreadDto {
        val article = articleAccessGuard.fetchAccessibleArticle(articleId)
        val creator = currentUserService.requireUser()

        // Only accepted reviewers may create review threads.
        // Authors/researchers should reply to existing threads instead.
        val reviewer = if (creator.hasRole(Role.REVIEWER) && !creator.hasRole(Role.ADMIN) && !creator.hasRole(Role.EDITOR)) {
            reviewerRepository.findByUserId(creator.id)
        } else {
            null
        }
        if (reviewer == null) {
            throw AccessDeniedException("Only reviewers can create comment threads")
        }
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(articleId, reviewer.id)
        if (relation == null || relation.deleted || relation.status != ReviewerInvitationStatus.ACCEPTED) {
            throw AccessDeniedException("Reviewer must accept the invitation before commenting")
        }

        val thread = CommentThread().apply {
            this.article = article
            version = request.version
            pageNumber = request.pageNumber
            x = request.x
            y = request.y
            width = request.width
            height = request.height
            selectedText = request.selectedText
            section = request.section
            status = CommentStatus.OPEN
            this.reviewer = reviewer
        }
        val comment = Comment().apply {
            content = request.content
            authorName = request.authorName
            authorId = request.authorId ?: ""
            this.thread = thread
        }
        thread.comments.add(comment)
        val saved = commentThreadRepository.save(thread)
        notifyCommentActivity(saved, comment, CommentActivityAction.THREAD_CREATED)
        return saved.toDto(shouldMaskReviewerIdentity(creator), reviewerArticleManager.reviewerLabels(articleId))
    }

    @Transactional
    override fun reply(threadId: String, request: CommentReplyRequestDto): CommentThreadDto {
        val thread = commentThreadRepository.findById(threadId)
            .orElseThrow { EntityNotFoundException("Comment thread not found with id $threadId") }
        articleAccessGuard.fetchAccessibleArticle(thread.article.id)
        ensureThreadPermission(thread)
        val comment = Comment().apply {
            content = request.content
            authorName = request.authorName
            authorId = request.authorId ?: ""
            this.thread = thread
        }
        val saved = commentRepository.save(comment)
        // Keep the in-memory model in sync for the response.
        // (Avoid persisting via both cascade + repository.save which can lead to duplicate inserts.)
        thread.comments.add(saved)
        notifyCommentActivity(thread, comment, CommentActivityAction.COMMENT_REPLIED)
        val viewer = currentUserService.currentUser()
        return thread.toDto(shouldMaskReviewerIdentity(viewer), reviewerArticleManager.reviewerLabels(thread.article.id))
    }

    @Transactional
    override fun updateStatus(threadId: String, request: CommentStatusUpdateRequestDto): CommentThreadDto {
        val thread = commentThreadRepository.findById(threadId)
            .orElseThrow { EntityNotFoundException("Comment thread not found with id $threadId") }
        articleAccessGuard.fetchAccessibleArticle(thread.article.id)
        ensureThreadPermission(thread)
        thread.status = request.status
        val saved = commentThreadRepository.save(thread)
        notifyCommentActivity(saved, null, CommentActivityAction.STATUS_UPDATED)
        val viewer = currentUserService.currentUser()
        return saved.toDto(shouldMaskReviewerIdentity(viewer), reviewerArticleManager.reviewerLabels(thread.article.id))
    }

    private fun CommentThread.toDto(
        maskReviewerIdentity: Boolean,
        reviewerLabels: Map<String, String>
    ): CommentThreadDto {
        val reviewerLabel = this.reviewer?.id?.let { reviewerLabels[it] }
        return CommentThreadDto(
        id = this.id,
        articleId = this.article.id,
        reviewerId = this.reviewer?.id.takeUnless { maskReviewerIdentity },
        reviewerLabel = reviewerLabel,
        version = this.version,
        pageNumber = this.pageNumber,
        x = this.x,
        y = this.y,
        width = this.width,
        height = this.height,
        selectedText = this.selectedText,
        section = this.section,
        status = this.status,
        comments = this.comments
            .filter { !it.deleted }  // Filter deleted comments in application code
            .distinctBy { it.id }
            .sortedBy { it.createdAt }
            .map { it.toDto(maskReviewerIdentity, reviewerLabel, this.reviewer) },
        createdAt = this.createdAt,
        updatedAt = this.updatedAt
        )
    }

    private fun Comment.toDto(
        maskReviewerIdentity: Boolean,
        reviewerLabel: String?,
        reviewer: Reviewer?
    ): CommentDto {
        val isReviewerComment = reviewer != null && (
            (!reviewer.user?.id.isNullOrBlank() && reviewer.user?.id == this.authorId) ||
                this.authorName.equals(reviewer.name, ignoreCase = true)
            )
        val displayAuthorName = if (maskReviewerIdentity && isReviewerComment) {
            reviewerLabel ?: "Reviewer"
        } else {
            this.authorName
        }
        val displayAuthorId = if (maskReviewerIdentity && isReviewerComment) null else this.authorId.takeIf { it.isNotBlank() }
        return CommentDto(
            id = this.id,
            content = this.content,
            authorName = displayAuthorName,
            authorId = displayAuthorId,
            createdAt = this.createdAt,
            createdBy = this.createdBy
        )
    }

    private fun threadBelongsToReviewer(thread: CommentThread, reviewerUserId: String): Boolean {
        val reviewer = thread.reviewer?.user ?: return false
        return reviewer.id == reviewerUserId
    }

    private fun ensureThreadPermission(thread: CommentThread) {
        val viewer = currentUserService.currentUser() ?: throw AccessDeniedException("Access denied")
        when {
            viewer.hasRole(Role.ADMIN) -> return
            viewer.hasRole(Role.EDITOR) -> {
                val trackId = viewer.track?.id ?: throw AccessDeniedException("Editor track missing")
                if (thread.article.track.id != trackId) {
                    throw AccessDeniedException("Editor cannot access this thread")
                }
            }
            viewer.hasRole(Role.REVIEWER) -> {
                if (!threadBelongsToReviewer(thread, viewer.id)) {
                    throw AccessDeniedException("Reviewer cannot access this thread")
                }

                val reviewerId = thread.reviewer?.id ?: throw AccessDeniedException("Reviewer cannot access this thread")
                val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(thread.article.id, reviewerId)
                if (relation == null || relation.deleted || relation.status != ReviewerInvitationStatus.ACCEPTED) {
                    throw AccessDeniedException("Reviewer must accept the invitation before commenting")
                }
            }
            viewer.hasRole(Role.RESEARCHER) -> {
                // articleAccessGuard.fetchAccessibleArticle already ensures ownership; nothing extra
            }
            else -> throw AccessDeniedException("Access denied")
        }
    }

    private fun notifyCommentActivity(
        thread: CommentThread,
        comment: Comment?,
        action: CommentActivityAction
    ) {
        val actorId = currentUserService.currentUser()?.id
        val recipients = resolveNotificationRecipients(thread, actorId)
        if (recipients.isEmpty()) {
            return
        }
        val payload = mutableMapOf<String, Any?>(
            "articleId" to thread.article.id,
            "threadId" to thread.id,
            "action" to action.name,
            "status" to thread.status.name,
            "version" to thread.version,
            "pageNumber" to thread.pageNumber,
            "section" to thread.section,
            "selectedText" to thread.selectedText
        )
        if (comment != null) {
            payload["commentId"] = comment.id
            payload["commentPreview"] = comment.content.take(160)
            payload["commentAuthor"] = comment.authorName
        }
        notificationService.notifyUsers(
            recipients,
            NotificationType.COMMENT_ACTIVITY,
            payload = payload,
            contextId = thread.id,
            contextType = "COMMENT_THREAD"
        )
    }

    private fun resolveNotificationRecipients(thread: CommentThread, actorId: String?): Set<String> {
        val article = thread.article
        val authorIds = articleAuthorRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .mapNotNull { it.author.user?.id }
        val editorIds = editorRepository.findAllByTrackIdAndDeletedFalse(article.track.id)
            .mapNotNull { it.user.id }
        val reviewerIds = reviewerArticleRepository.findAllByArticleIdAndDeletedFalse(article.id)
            .mapNotNull { it.reviewer.user?.id }
        val threadReviewerId = thread.reviewer?.user?.id
        return (authorIds + editorIds + reviewerIds + listOfNotNull(threadReviewerId))
            .filter { !it.isNullOrBlank() && it != actorId }
            .mapNotNull { it }
            .toSet()
    }

    private enum class CommentActivityAction {
        THREAD_CREATED,
        COMMENT_REPLIED,
        STATUS_UPDATED
    }
}
