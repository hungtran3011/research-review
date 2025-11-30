package com.example.researchreview.services

import com.example.researchreview.dtos.CommentCreateRequestDto
import com.example.researchreview.dtos.CommentReplyRequestDto
import com.example.researchreview.dtos.CommentStatusUpdateRequestDto
import com.example.researchreview.dtos.CommentThreadDto

interface CommentService {
    fun listThreads(articleId: String): List<CommentThreadDto>
    fun createThread(articleId: String, request: CommentCreateRequestDto): CommentThreadDto
    fun reply(threadId: String, request: CommentReplyRequestDto): CommentThreadDto
    fun updateStatus(threadId: String, request: CommentStatusUpdateRequestDto): CommentThreadDto
}
