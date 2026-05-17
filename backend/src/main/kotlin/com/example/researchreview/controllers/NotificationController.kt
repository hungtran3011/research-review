package com.example.researchreview.controllers

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.NotificationDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.services.NotificationService
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
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
        try {
            val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100))
            val notifications = notificationService.getCurrentUserNotifications(pageable)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Notifications retrieved",
                    data = PageResponseDto.from(notifications)
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null
                )
            )
        }
    }

    @PostMapping("/{id}/read")
    fun markAsRead(@PathVariable id: String): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            notificationService.markAsRead(id)
            ResponseEntity.ok(
                BaseResponseDto<Unit>(
                    code = 200,
                    message = "Notification marked as read"
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto<Unit>(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key
                )
            )
        }
    }
}
