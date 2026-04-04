package com.example.researchreview.controllers

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleDashboardStatsDto
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
import org.springframework.http.HttpStatus
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
            ResponseEntity.status(HttpStatus.CREATED).body(
                BaseResponseDto(
                    code = 201,
                    message = "Article submitted successfully",
                    data = created
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping
    fun list(
        pageable: Pageable,
        @RequestParam(required = false) title: String?,
        @RequestParam(required = false) author: String?,
        @RequestParam(required = false) status: ArticleStatus?,
    ): ResponseEntity<BaseResponseDto<PageResponseDto<ArticleDto>>> {
        val articles = articlesService.getAll(pageable, title, author, status)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "Articles retrieved successfully",
                data = PageResponseDto.from(articles)
            )
        )
    }

    @GetMapping("/dashboard/stats")
    fun dashboardStats(
        @RequestParam(required = false) title: String?,
        @RequestParam(required = false) author: String?,
        @RequestParam(required = false) status: ArticleStatus?,
    ): ResponseEntity<BaseResponseDto<ArticleDashboardStatsDto>> {
        val stats = articlesService.getDashboardStats(title, author, status)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "article.dashboard.stats.retrieved",
                data = stats,
            )
        )
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val article = articlesService.getById(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Article retrieved",
                    data = article
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "article.notFound"
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
                    code = 200,
                    message = "Article updated",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
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
                    code = 200,
                    message = "Article deleted"
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "article.notFound"
                )
            )
        }
    }

    @PostMapping("/{id}/initial-review")
    @PreAuthorize("hasAnyRole('EDITOR','CHAIR')")
    fun initialReview(
        @PathVariable id: String,
        @Valid @RequestBody request: InitialReviewRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val reviewed = articlesService.initialReview(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Initial review recorded",
                    data = reviewed
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "article.notFound"
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
                code = 200,
                message = "Article link updated",
                data = updated
            )
        )
    }

    @PostMapping("/{id}/reviewers")
    @PreAuthorize("hasAnyRole('EDITOR','CHAIR')")
    fun assignReviewer(
        @PathVariable id: String,
        @Valid @RequestBody reviewer: ReviewerRequestDto
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val article = articlesService.assignReviewer(id, reviewer)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Reviewer assigned successfully",
                    data = article
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "error.not.found"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "error.invalid.request"
                )
            )
        }
    }

    @PostMapping("/{id}/reviews/completed")
    @PreAuthorize("hasAnyRole('EDITOR','CHAIR')")
    fun markReviewsCompleted(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.markReviewsCompleted(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Article moved to REVIEWS_COMPLETED",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/{id}/decision/revisions")
    @PreAuthorize("hasRole('CHAIR')")
    fun requestRevisions(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val updated = articlesService.requestRevisions(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Revisions requested",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/{id}/decision/approve")
    @PreAuthorize("hasRole('CHAIR')")
    fun approve(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            articlesService.approve(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Article approved"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/{id}/decision/reject")
    @PreAuthorize("hasRole('CHAIR')")
    fun reject(
        @PathVariable id: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            articlesService.reject(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Article rejected"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/{id}/reviewers/contact")
    @PreAuthorize("hasAnyRole('EDITOR','CHAIR')")
    fun contactReviewers(
        @PathVariable id: String,
        @Valid @RequestBody request: ReviewerContactRequestDto
    ): ResponseEntity<BaseResponseDto<List<ReviewerDto>>> {
        return try {
            val reviewers = reviewerService.contactReviewers(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Reviewers contacted successfully",
                    data = reviewers
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "error.invalid.request"
                )
            )
        }
    }

    @GetMapping("/{id}/reviewers")
    fun getReviewers(@PathVariable id: String): ResponseEntity<BaseResponseDto<List<ReviewerDto>>> {
        val reviewers = articlesService.getReviewers(id)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
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
                    code = 200,
                    message = "Revision submitted successfully",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
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
                    code = 200,
                    message = "Revisions started",
                    data = updated
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: "error.internal.server"
                )
            )
        }
    }
}
