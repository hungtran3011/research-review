package com.example.researchreview.services

import com.example.researchreview.dtos.StructuredReviewAnonymizedDto
import com.example.researchreview.dtos.StructuredReviewDto
import com.example.researchreview.dtos.StructuredReviewSubmitRequestDto

interface StructuredReviewService {
    fun saveOrSubmit(articleId: String, request: StructuredReviewSubmitRequestDto): StructuredReviewDto
    fun getMyReview(articleId: String): StructuredReviewDto?
    fun getChairView(articleId: String): List<StructuredReviewDto>
    fun getAnonymizedView(articleId: String): List<StructuredReviewAnonymizedDto>
}
