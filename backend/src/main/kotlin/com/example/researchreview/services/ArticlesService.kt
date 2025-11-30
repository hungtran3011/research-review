package com.example.researchreview.services

import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ArticlesService {
    fun getAll(pageable: Pageable): Page<ArticleDto>
    fun getById(id: String): ArticleDto
    fun create(articleDto: ArticleRequestDto): ArticleDto
    fun update(articleDto: ArticleRequestDto): ArticleDto
    fun delete(id: String)
    fun assignReviewer(id: String, reviewer: ReviewerRequestDto): ArticleDto
    fun unassignReviewer(id: String, reviewerId: String): ArticleDto
    fun reject(id: String)
    fun approve(id: String)
    fun getReviewers(id: String): List<ReviewerDto>
    fun requestRejection(id: String): Unit
    fun requestApproval(id: String): Unit
    fun initialReview(articleId: String, request: InitialReviewRequestDto): ArticleDto
}