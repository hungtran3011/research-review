package com.example.researchreview.services.impl

import com.example.researchreview.constants.CommentStatus
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.constants.NotificationType
import com.example.researchreview.constants.ReviewerInvitationStatus
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
        if (viewer.globalRole == GlobalRole.ADMIN) return false
        val hasEditorTracks = editorRepository.findAllByUserIdAndDeletedFalse(viewer.id).isNotEmpty()
        if (hasEditorTracks) return false
        val reviewerProfile = reviewerRepository.findByUserId(viewer.id)
        return reviewerProfile == null
    }

    @Transactional(readOnly = true)
    override fun listThreads(articleId: String): List<CommentThreadDto> {
        articleAccessGuard.fetchAccessibleArticle(articleId)
        val viewer = currentUserService.currentUser()
        val reviewerLabels = reviewerArticleManager.reviewerLabels(articleId)
        val threads = commentThreadRepository.findAllByArticleId(articleId)
            // Reviewers can only see their own comment threads
            val filtered = when {
                viewer != null && viewer.globalRole != GlobalRole.ADMIN && reviewerRepository.findByUserId(viewer.id) != null &&
                    editorRepository.findAllByUserIdAndDeletedFalse(viewer.id).isEmpty() ->
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
        val reviewer = reviewerRepository.findByUserId(creator.id)
        if (reviewer == null) {
            throw AccessDeniedException("comments.onlyReviewerCanCreateThread")
        }
        val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(articleId, reviewer.id)
        if (relation == null || relation.deleted || relation.status != ReviewerInvitationStatus.ACCEPTED) {
            throw AccessDeniedException("comments.reviewerMustAcceptInvitation")
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
            .orElseThrow { EntityNotFoundException("comments.threadNotFound") }
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
            .orElseThrow { EntityNotFoundException("comments.threadNotFound") }
        articleAccessGuard.fetchAccessibleArticle(thread.article.id)
        ensureThreadPermission(thread)
        thread.status = request.status
        val saved = commentThreadRepository.save(thread)
        notifyCommentActivity(saved, null, CommentActivityAction.STATUS_UPDATED)
        val viewer = currentUserService.currentUser()
        return saved.toDto(shouldMaskReviewerIdentity(viewer), reviewerArticleManager.reviewerLabels(thread.article.id))
    }

    @Transactional
    override fun deleteComment(commentId: String): CommentThreadDto {
        val comment = commentRepository.findById(commentId)
            .orElseThrow { EntityNotFoundException("comments.commentNotFound") }
        if (comment.deleted) {
            throw EntityNotFoundException("comments.commentNotFound")
        }

        val thread = comment.thread
        articleAccessGuard.fetchAccessibleArticle(thread.article.id)
        ensureThreadPermission(thread)
        ensureDeleteCommentPermission(thread, comment)

        comment.deleted = true
        commentRepository.save(comment)
        notifyCommentActivity(thread, comment, CommentActivityAction.COMMENT_DELETED)

        val viewer = currentUserService.currentUser()
        return thread.toDto(shouldMaskReviewerIdentity(viewer), reviewerArticleManager.reviewerLabels(thread.article.id))
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
        val viewer = currentUserService.currentUser() ?: throw AccessDeniedException("comments.accessDenied")
        when {
            viewer.globalRole == GlobalRole.ADMIN -> return
            editorRepository.findAllByUserIdAndDeletedFalse(viewer.id).isNotEmpty() -> {
                val editorTrackIds = editorRepository.findAllByUserIdAndDeletedFalse(viewer.id)
                    .map { it.track.id }
                    .toSet()
                if (editorTrackIds.isEmpty()) {
                    throw AccessDeniedException("comments.editorTrackMissing")
                }
                if (!editorTrackIds.contains(thread.article.track.id)) {
                    throw AccessDeniedException("comments.editorCannotAccessThread")
                }
            }
            reviewerRepository.findByUserId(viewer.id) != null -> {
                if (!threadBelongsToReviewer(thread, viewer.id)) {
                    throw AccessDeniedException("comments.reviewerCannotAccessThread")
                }

                val reviewerId = thread.reviewer?.id ?: throw AccessDeniedException("comments.reviewerCannotAccessThread")
                val relation = reviewerArticleRepository.findByArticleIdAndReviewerId(thread.article.id, reviewerId)
                if (relation == null || relation.deleted || relation.status != ReviewerInvitationStatus.ACCEPTED) {
                    throw AccessDeniedException("comments.reviewerMustAcceptInvitation")
                }
            }
            else -> {
                // articleAccessGuard.fetchAccessibleArticle already ensures ownership; nothing extra
            }
        }
    }

    private fun ensureDeleteCommentPermission(thread: CommentThread, comment: Comment) {
        val viewer = currentUserService.currentUser() ?: throw AccessDeniedException("comments.accessDenied")
        if (viewer.globalRole == GlobalRole.ADMIN) {
            return
        }

        val canManageAsEditor = editorRepository.findAllByUserIdAndDeletedFalse(viewer.id)
            .any { editor -> editor.track.id == thread.article.track.id }
        if (canManageAsEditor) {
            return
        }

        val isCommentOwner = comment.createdBy == viewer.id ||
            (comment.authorId.isNotBlank() && comment.authorId == viewer.id)
        if (!isCommentOwner) {
            throw AccessDeniedException("comments.deleteDenied")
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
        STATUS_UPDATED,
        COMMENT_DELETED
    }
}
