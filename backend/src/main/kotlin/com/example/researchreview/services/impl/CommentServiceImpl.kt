package com.example.researchreview.services.impl

import com.example.researchreview.constants.CommentStatus
import com.example.researchreview.dtos.CommentCreateRequestDto
import com.example.researchreview.dtos.CommentDto
import com.example.researchreview.dtos.CommentReplyRequestDto
import com.example.researchreview.dtos.CommentStatusUpdateRequestDto
import com.example.researchreview.dtos.CommentThreadDto
import com.example.researchreview.entities.Comment
import com.example.researchreview.entities.CommentThread
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.CommentRepository
import com.example.researchreview.repositories.CommentThreadRepository
import com.example.researchreview.services.CommentService
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CommentServiceImpl(
    private val commentThreadRepository: CommentThreadRepository,
    private val commentRepository: CommentRepository,
    private val articleRepository: ArticleRepository
) : CommentService {

    @Transactional(readOnly = true)
    override fun listThreads(articleId: String): List<CommentThreadDto> {
        return commentThreadRepository.findAllByArticleId(articleId).map { it.toDto() }
    }

    @Transactional
    override fun createThread(articleId: String, request: CommentCreateRequestDto): CommentThreadDto {
        val article = articleRepository.findByIdAndDeletedFalse(articleId)
            .orElseThrow { EntityNotFoundException("Article not found with id $articleId") }
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
        }
        val comment = Comment().apply {
            content = request.content
            authorName = request.authorName
            authorId = request.authorId ?: ""
            this.thread = thread
        }
        thread.comments.add(comment)
        val saved = commentThreadRepository.save(thread)
        return saved.toDto()
    }

    @Transactional
    override fun reply(threadId: String, request: CommentReplyRequestDto): CommentThreadDto {
        val thread = commentThreadRepository.findById(threadId)
            .orElseThrow { EntityNotFoundException("Comment thread not found with id $threadId") }
        val comment = Comment().apply {
            content = request.content
            authorName = request.authorName
            authorId = request.authorId ?: ""
            this.thread = thread
        }
        thread.comments.add(comment)
        commentRepository.save(comment)
        return thread.toDto()
    }

    @Transactional
    override fun updateStatus(threadId: String, request: CommentStatusUpdateRequestDto): CommentThreadDto {
        val thread = commentThreadRepository.findById(threadId)
            .orElseThrow { EntityNotFoundException("Comment thread not found with id $threadId") }
        thread.status = request.status
        val saved = commentThreadRepository.save(thread)
        return saved.toDto()
    }

    private fun CommentThread.toDto(): CommentThreadDto = CommentThreadDto(
        id = this.id,
        articleId = this.article.id,
        reviewerId = this.reviewer?.id,
        version = this.version,
        pageNumber = this.pageNumber,
        x = this.x,
        y = this.y,
        width = this.width,
        height = this.height,
        selectedText = this.selectedText,
        section = this.section,
        status = this.status,
        comments = this.comments.sortedBy { it.createdAt }.map { it.toDto() },
        createdAt = this.createdAt,
        updatedAt = this.updatedAt
    )

    private fun Comment.toDto(): CommentDto = CommentDto(
        id = this.id,
        content = this.content,
        authorName = this.authorName,
        authorId = this.authorId.takeIf { it.isNotBlank() },
        createdAt = this.createdAt,
        createdBy = this.createdBy
    )
}
