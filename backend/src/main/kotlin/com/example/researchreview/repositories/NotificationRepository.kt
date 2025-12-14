package com.example.researchreview.repositories

import com.example.researchreview.entities.Notification
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface NotificationRepository : JpaRepository<Notification, String> {
    fun findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId: String, pageable: Pageable): Page<Notification>
}
