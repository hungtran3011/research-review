package com.example.researchreview.dtos

import com.example.researchreview.constants.NotificationType
import java.time.LocalDateTime

data class NotificationDto(
    val id: String,
    val type: NotificationType,
    val payload: Map<String, Any?>,
    val contextId: String?,
    val contextType: String?,
    val readAt: LocalDateTime?,
    val createdAt: LocalDateTime?
)
