package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ReviewerInviteDecisionDto
import com.example.researchreview.dtos.ReviewerInviteResolveDto
import com.example.researchreview.services.ReviewerInviteDecisionService
import com.example.researchreview.services.ReviewerInviteService
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.http.HttpStatus
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
    private val reviewerInviteDecisionService: ReviewerInviteDecisionService,
    private val messageSource: MessageSource,
) {

    private fun msg(code: String): String = messageSource.getMessage(code, null, LocaleContextHolder.getLocale()) ?: code
    private fun resolveMessage(message: String?, fallbackCode: String): String {
        if (message.isNullOrBlank()) return msg(fallbackCode)
        return messageSource.getMessage(message, null, message, LocaleContextHolder.getLocale()) ?: message
    }

    @GetMapping("/resolve")
    fun resolve(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteResolveDto>> {
        return try {
            val dto = reviewerInviteService.resolve(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = msg("reviewerInvite.resolved"),
                    data = dto
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = resolveMessage(e.message, "reviewerInvite.invalidToken"),
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = msg("error.internal.server"),
                    data = null
                )
            )
        }
    }

    @PostMapping("/accept")
    @PreAuthorize("isAuthenticated()")
    fun accept(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteDecisionDto>> {
        return try {
            val dto = reviewerInviteDecisionService.accept(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = msg("reviewerInvite.accepted"),
                    data = dto
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = resolveMessage(e.message, "reviewerInvite.acceptFailed"),
                    data = null
                )
            )
        }
    }

    @PostMapping("/decline")
    @PreAuthorize("isAuthenticated()")
    fun decline(@RequestParam token: String): ResponseEntity<BaseResponseDto<ReviewerInviteDecisionDto>> {
        return try {
            val dto = reviewerInviteDecisionService.decline(token)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = msg("reviewerInvite.declined"),
                    data = dto
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = resolveMessage(e.message, "reviewerInvite.declineFailed"),
                    data = null
                )
            )
        }
    }
}
