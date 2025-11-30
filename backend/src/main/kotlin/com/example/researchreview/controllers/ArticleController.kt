package com.example.researchreview.controllers

import com.example.researchreview.constants.ArticleBusinessCode
import com.example.researchreview.constants.ReviewerBusinessCode
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.services.ArticlesService
import com.example.researchreview.services.ReviewerService
import jakarta.persistence.EntityNotFoundException
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/articles")
class ArticleController(
    private val articlesService: ArticlesService,
    private val reviewerService: ReviewerService
) {

    @PostMapping
    fun submit(@Valid @RequestBody request: ArticleRequestDto): ResponseEntity<BaseResponseDto<ArticleDto>> {
        return try {
            val created = articlesService.create(request)
            ResponseEntity.status(201).body(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_CREATED_SUCCESSFULLY.value,
                    message = "Article submitted successfully",
                    data = created
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.badRequest().body(
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
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PutMapping("/{id}")
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
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_CREATED_FAIL.value,
                    message = ex.message ?: "Unable to update article"
                )
            )
        }
    }

    @DeleteMapping("/{id}")
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
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PostMapping("/{id}/initial-review")
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
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = ArticleBusinessCode.ARTICLE_NOT_FOUND.value,
                    message = ex.message ?: "Article not found"
                )
            )
        }
    }

    @PostMapping("/{id}/reviewers/contact")
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
            ResponseEntity.badRequest().body(
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
}
