package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ReviewerInviteDecisionDto
import com.example.researchreview.dtos.ReviewerInviteResolveDto
import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.services.ReviewerInviteDecisionService
import com.example.researchreview.services.ReviewerInviteService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/reviewer-invites")
class ReviewerInviteController(
    private val reviewerInviteService: ReviewerInviteService,
    private val reviewerInviteDecisionService: ReviewerInviteDecisionService
) {

    @GetMapping("/resolve")
    fun resolve(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteResolveDto>> {
        return try {
            val dto = reviewerInviteService.resolve(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Invitation resolved",
                    data = dto
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid token",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PostMapping("/accept")
    @PreAuthorize("hasRole('REVIEWER')")
    fun accept(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteDecisionDto>> {
        return try {
            val dto = reviewerInviteDecisionService.accept(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Invitation accepted",
                    data = dto
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Failed to accept invitation",
                    data = null
                )
            )
        }
    }

    @PostMapping("/decline")
    @PreAuthorize("hasRole('REVIEWER')")
    fun decline(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteDecisionDto>> {
        return try {
            val dto = reviewerInviteDecisionService.decline(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Invitation declined",
                    data = dto
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Failed to decline invitation",
                    data = null
                )
            )
        }
    }
}
