package com.example.researchreview.controllers

import com.example.researchreview.constants.ArticleBusinessCode
import com.example.researchreview.constants.ReviewerBusinessCode
import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ArticleLinkUpdateRequestDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.services.ArticlesService
import com.example.researchreview.services.ReviewerService
import jakarta.persistence.EntityNotFoundException
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/articles")
class ArticleController(
    private val articlesService: ArticlesService,
    private val reviewerService: ReviewerService
) {

    @PostMapping
    @PreAuthorize("hasRole('RESEARCHER')")
    fun submit(@Valid @RequestBody request: ArticleRequestDto): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val created = articlesService.create(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_CREATED_SUCCESSFULLY.value,
                    message = "Article submitted successfully",
                    data = created
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_CREATED_FAIL.value,
                    message = ex.message ?: "Unable to submit article"
                )
            )
        }
    }

    @GetMapping
    fun list(pageable: Pageable): ResponseEntity<BaseResponseDto<PageResponseDto<ArticleDto>>> {
        val articles = articlesService.getAll(pageable)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = ArticleBusinessCode.ARTICLE_FOUND.value,
                message = "Articles retrieved successfully",
                data = PageResponseDto.from(articles)
            )
        )
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val article = articlesService.getById(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_FOUND.value,
                    message = "Article retrieved",
                    data = article
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    fun update(@PathVariable id: String, @Valid @RequestBody request: ArticleRequestDto): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            request.id = id
            val updated = articlesService.update(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY.value,
                    message = "Article updated",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_CREATED_FAIL.value,
                    message = ex.message ?: "Unable to update article"
                )
            )
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    fun delete(@PathVariable id: String): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            articlesService.delete(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY.value,
                    message = "Article deleted"
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PostMapping("/{id}/initial-review")
    @PreAuthorize("hasRole('EDITOR')")
    fun initialReview(
        @PathVariable id: String,
        @Valid @RequestBody request: InitialReviewRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val reviewed = articlesService.initialReview(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Initial review recorded",
                    data = reviewed
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PutMapping("/{id}/link")
    @PreAuthorize("hasRole('RESEARCHER')")
    fun updateLink(
        @PathVariable id: String,
        @Valid @RequestBody request: ArticleLinkUpdateRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        val updated = articlesService.updateLink(id, request.link)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY.value,
                message = "Article link updated",
                data = updated
            )
        )
    }

    @PostMapping("/{id}/reviewers")
    @PreAuthorize("hasRole('EDITOR')")
    fun assignReviewer(
        @PathVariable id: String,
        @Valid @RequestBody reviewer: ReviewerRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val article = articlesService.assignReviewer(id, reviewer)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ReviewerBusinessCode.REVIEWER_ASSIGNED.value,
                    message = "Reviewer assigned successfully",
                    data = article
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article or institution not found"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ReviewerBusinessCode.REVIEWER_ASSIGNMENT_FAILED.value,
                    message = ex.message ?: "Failed to assign reviewer"
                )
            )
        }
    }

    @PostMapping("/{id}/review-requests/reject")
    @PreAuthorize("hasRole('REVIEWER')")
    fun requestReject(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.requestRejection(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Rejection requested",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to request rejection"
                )
            )
        }
    }

    @PostMapping("/{id}/review-requests/approve")
    @PreAuthorize("hasRole('REVIEWER')")
    fun requestApprove(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.requestApproval(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Approval requested",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to request approval"
                )
            )
        }
    }

    @PostMapping("/{id}/review-requests/revisions")
    @PreAuthorize("hasRole('REVIEWER')")
    fun requestRevisions(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.requestRevisions(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Revisions requested",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to request revisions"
                )
            )
        }
    }

    @PostMapping("/{id}/decision/approve")
    @PreAuthorize("hasRole('EDITOR')")
    fun approve(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            articlesService.approve(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Article approved"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to approve article"
                )
            )
        }
    }

    @PostMapping("/{id}/decision/reject")
    @PreAuthorize("hasRole('EDITOR')")
    fun reject(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            articlesService.reject(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Article rejected"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to reject article"
                )
            )
        }
    }

    @PostMapping("/{id}/reviewers/contact")
    @PreAuthorize("hasRole('EDITOR')")
    fun contactReviewers(
        @PathVariable id: String,
        @Valid @RequestBody request: ReviewerContactRequestDto
    ): ResponseEntity<BaseResponseDto<List<ReviewerDto>>> {
        return try {
            val reviewers = reviewerService.contactReviewers(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ReviewerBusinessCode.REVIEWER_CONTACTED.value,
                    message = "Reviewers contacted successfully",
                    data = reviewers
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ReviewerBusinessCode.REVIEWER_CONTACT_FAILED.value,
                    message = ex.message ?: "Failed to contact reviewers"
                )
            )
        }
    }

    @GetMapping("/{id}/reviewers")
    fun getReviewers(@PathVariable id: String): ResponseEntity<BaseResponseDto<List<ReviewerDto>>> {
        val reviewers = articlesService.getReviewers(id)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = ReviewerBusinessCode.REVIEWER_CONTACTED.value,
                message = "Reviewers retrieved",
                data = reviewers
            )
        )
    }

    @PostMapping("/{id}/revisions")
    @PreAuthorize("hasRole('RESEARCHER')")
    fun submitRevision(
        @PathVariable id: String,
        @RequestParam file: MultipartFile,
        @RequestParam(required = false) notes: String?
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.submitRevision(id, file, notes)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_UPDATED_SUCCESSFULLY.value,
                    message = "Revision submitted successfully",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to submit revision"
                )
            )
        }
    }

    @PostMapping("/{id}/revisions/start")
    @PreAuthorize("hasRole('RESEARCHER')")
    fun startRevisions(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.startRevisions(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_STATUS_UPDATED.value,
                    message = "Revisions started",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.GENERAL_ERROR.value,
                    message = ex.message ?: "Failed to start revisions"
                )
            )
        }
    }
}
