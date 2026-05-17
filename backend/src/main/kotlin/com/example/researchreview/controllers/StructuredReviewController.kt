package com.example.researchreview.controllers

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.StructuredReviewAnonymizedDto
import com.example.researchreview.dtos.StructuredReviewDto
import com.example.researchreview.dtos.StructuredReviewSubmitRequestDto
import com.example.researchreview.services.StructuredReviewService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/articles/{articleId}/structured-reviews")
class StructuredReviewController(
    private val structuredReviewService: StructuredReviewService,
) {

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    fun saveOrSubmit(
        @PathVariable articleId: String,
        @Valid @RequestBody request: StructuredReviewSubmitRequestDto,
    ): ResponseEntity<BaseResponseDto<StructuredReviewDto>> {
        try {
            val data = structuredReviewService.saveOrSubmit(articleId, request)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = if (request.finalSubmit) "Structured review submitted" else "Structured review draft saved",
                    data = data,
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null,
                )
            )
        }
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    fun getMyReview(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<StructuredReviewDto?>> {
        try {
            val data = structuredReviewService.getMyReview(articleId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "My structured review retrieved", data = data))
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null,
                )
            )
        }
    }

    @GetMapping("/editor-view")
    @PreAuthorize("isAuthenticated()")
    fun getEditorView(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<List<StructuredReviewDto>>> {
        try {
            val data = structuredReviewService.getEditorView(articleId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Structured reviews retrieved", data = data))
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null,
                )
            )
        }
    }

    @GetMapping("/chair-view")
    @PreAuthorize("isAuthenticated()")
    fun getChairViewCompat(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<List<StructuredReviewDto>>> {
        try {
            val data = structuredReviewService.getEditorView(articleId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Structured reviews retrieved", data = data))
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null,
                )
            )
        }
    }

    @GetMapping("/anonymized")
    @PreAuthorize("isAuthenticated()")
    fun getAnonymizedView(@PathVariable articleId: String): ResponseEntity<BaseResponseDto<List<StructuredReviewAnonymizedDto>>> {
        try {
            val data = structuredReviewService.getAnonymizedView(articleId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Anonymized structured reviews retrieved", data = data))
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null,
                )
            )
        }
    }
}
