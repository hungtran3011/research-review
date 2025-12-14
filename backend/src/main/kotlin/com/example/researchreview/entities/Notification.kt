package com.example.researchreview.entities

import com.example.researchreview.constants.NotificationType
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "notification")
class Notification : BaseEntity() {
    @ManyToOne
    @JoinColumn(name = "user_id")
    var user: User = User()

    @Enumerated(EnumType.STRING)
    var type: NotificationType = NotificationType.COMMENT_ACTIVITY

    var payload: String? = null
    var contextId: String? = null
    var contextType: String? = null
    var readAt: LocalDateTime? = null
}
