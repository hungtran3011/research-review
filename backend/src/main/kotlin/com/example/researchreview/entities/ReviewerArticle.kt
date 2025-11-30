package com.example.researchreview.entities

import com.example.researchreview.constants.ReviewerInvitationStatus
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "reviewer_article")
class ReviewerArticle: BaseEntity() {
    @ManyToOne
    var reviewer: Reviewer = Reviewer();

    @ManyToOne
    var article: Article = Article();

    @Enumerated(EnumType.STRING)
    var status: ReviewerInvitationStatus = ReviewerInvitationStatus.PENDING;

    var invitedAt: LocalDateTime? = null;
}