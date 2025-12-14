package com.example.researchreview.services.impl

import com.example.researchreview.constants.NotificationType
import com.example.researchreview.dtos.NotificationDto
import com.example.researchreview.entities.Notification
import com.example.researchreview.repositories.NotificationRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.services.NotificationService
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class NotificationServiceImpl(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository,
    private val currentUserService: CurrentUserService,
    private val objectMapper: ObjectMapper
) : NotificationService {

    override fun getCurrentUserNotifications(pageable: Pageable): Page<NotificationDto> {
        val user = currentUserService.requireUser()
        return notificationRepository
            .findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(user.id, pageable)
            .map { it.toDto() }
    }

    override fun markAsRead(notificationId: String) {
        val user = currentUserService.requireUser()
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { EntityNotFoundException("Notification not found") }
        if (notification.user.id != user.id) {
            throw AccessDeniedException("Cannot modify notification")
        }
        notification.readAt = notification.readAt ?: LocalDateTime.now()
        notificationRepository.save(notification)
    }

    override fun notifyUser(
        userId: String,
        type: NotificationType,
        payload: Map<String, Any?>,
        contextId: String?,
        contextType: String?
    ) {
        val user = userRepository.findByIdAndDeletedFalse(userId)
            .orElseThrow { EntityNotFoundException("User not found: $userId") }
        val notification = Notification().apply {
            this.user = user
            this.type = type
            this.payload = serializePayload(payload)
            this.contextId = contextId
            this.contextType = contextType
        }
        notificationRepository.save(notification)
    }

    override fun notifyUsers(
        userIds: Collection<String>,
        type: NotificationType,
        payload: Map<String, Any?>,
        contextId: String?,
        contextType: String?
    ) {
        userIds.filter { it.isNotBlank() }.forEach {
            notifyUser(it, type, payload, contextId, contextType)
        }
    }

    private fun Notification.toDto(): NotificationDto = NotificationDto(
        id = this.id,
        type = this.type,
        payload = deserializePayload(this.payload),
        contextId = this.contextId,
        contextType = this.contextType,
        readAt = this.readAt,
        createdAt = this.createdAt
    )

    private fun serializePayload(payload: Map<String, Any?>): String? {
        if (payload.isEmpty()) return null
        return objectMapper.writeValueAsString(payload)
    }

    private fun deserializePayload(payload: String?): Map<String, Any?> {
        if (payload.isNullOrBlank()) return emptyMap()
        return objectMapper.readValue(payload, Map::class.java) as Map<String, Any?>
    }
}
