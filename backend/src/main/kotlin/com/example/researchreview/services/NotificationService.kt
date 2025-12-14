package com.example.researchreview.services

import com.example.researchreview.constants.NotificationType
import com.example.researchreview.dtos.NotificationDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface NotificationService {
    fun getCurrentUserNotifications(pageable: Pageable): Page<NotificationDto>
    fun markAsRead(notificationId: String)
    fun notifyUser(
        userId: String,
        type: NotificationType,
        payload: Map<String, Any?> = emptyMap(),
        contextId: String? = null,
        contextType: String? = null
    )
    fun notifyUsers(
        userIds: Collection<String>,
        type: NotificationType,
        payload: Map<String, Any?> = emptyMap(),
        contextId: String? = null,
        contextType: String? = null
    )
}
