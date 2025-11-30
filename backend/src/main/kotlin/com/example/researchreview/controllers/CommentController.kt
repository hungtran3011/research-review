package com.example.researchreview.controllers

import com.example.researchreview.constants.CommentBusinessCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.CommentCreateRequestDto
import com.example.researchreview.dtos.CommentReplyRequestDto
import com.example.researchreview.dtos.CommentStatusUpdateRequestDto
import com.example.researchreview.dtos.CommentThreadDto
import com.example.researchreview.services.CommentService
import jakarta.persistence.EntityNotFoundException
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
class CommentController(
    private val commentService: CommentService
) {

    @GetMapping("/articles/{articleId}/comments")
    fun list(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<List<CommentThreadDto>>> {
        val threads = commentService.listThreads(articleId)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = CommentBusinessCode.COMMENT_THREAD_FOUND.value,
                message = "Comments retrieved",
                data = threads
            )
        )
    }

    @PostMapping("/articles/{articleId}/comments")
    fun create(
        @PathVariable articleId: String,
        @Valid @RequestBody request: CommentCreateRequestDto
    ): ResponseEntity<BaseResponseDto<CommentThreadDto>> {
        val created = commentService.createThread(articleId, request)
        return ResponseEntity.status(201).body(
            BaseResponseDto(
                code = CommentBusinessCode.COMMENT_THREAD_CREATED.value,
                message = "Comment added",
                data = created
            )
        )
    }

    @PostMapping("/comments/{threadId}/replies")
    fun reply(
        @PathVariable threadId: String,
        @Valid @RequestBody request: CommentReplyRequestDto
    ): ResponseEntity<BaseResponseDto<CommentThreadDto>> {
        return try {
            val updated = commentService.reply(threadId, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = CommentBusinessCode.COMMENT_THREAD_UPDATED.value,
                    message = "Reply posted",
                    data = updated
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = CommentBusinessCode.COMMENT_THREAD_NOT_FOUND.value,
                    message = ex.message ?: "Thread not found"
                )
            )
        }
    }

    @PatchMapping("/comments/{threadId}/status")
    fun updateStatus(
        @PathVariable threadId: String,
        @Valid @RequestBody request: CommentStatusUpdateRequestDto
    ): ResponseEntity<BaseResponseDto<CommentThreadDto>> {
        return try {
            val updated = commentService.updateStatus(threadId, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = CommentBusinessCode.COMMENT_THREAD_UPDATED.value,
                    message = "Thread updated",
                    data = updated
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = CommentBusinessCode.COMMENT_THREAD_NOT_FOUND.value,
                    message = ex.message ?: "Thread not found"
                )
            )
        }
    }
}
