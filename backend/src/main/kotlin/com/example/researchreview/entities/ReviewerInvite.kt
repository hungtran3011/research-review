package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "reviewer_invite")
class ReviewerInvite : BaseEntity() {

    @Column(unique = true)
    var tokenHash: String = ""

    var email: String = ""

    var articleId: String = ""

    var expiresAt: LocalDateTime = LocalDateTime.now()

    var usedAt: LocalDateTime? = null
}
