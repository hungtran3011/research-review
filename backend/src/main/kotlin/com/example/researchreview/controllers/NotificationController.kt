package com.example.researchreview.controllers

import com.example.researchreview.constants.NotificationBusinessCode
import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.NotificationDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.services.NotificationService
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/notifications")
@PreAuthorize("isAuthenticated()")
class NotificationController(
    private val notificationService: NotificationService
) {

    @GetMapping
    fun list(@RequestParam(defaultValue = "0") page: Int, @RequestParam(defaultValue = "20") size: Int): ResponseEntity<BaseResponseDto<PageResponseDto<NotificationDto>>> {
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100))
        val notifications = notificationService.getCurrentUserNotifications(pageable)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = NotificationBusinessCode.NOTIFICATION_FOUND.value,
                message = "Notifications retrieved",
                data = PageResponseDto.from(notifications)
            )
        )
    }

    @PostMapping("/{id}/read")
    fun markAsRead(@PathVariable id: String): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            notificationService.markAsRead(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = NotificationBusinessCode.NOTIFICATION_UPDATED.value,
                    message = "Notification marked as read"
                )
            )
        } catch (ex: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = ex.message ?: "Unable to update notification"
                )
            )
        }
    }
}
