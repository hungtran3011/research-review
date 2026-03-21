package com.example.researchreview.entities

import com.example.researchreview.constants.ReviewRecommendation
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "structured_review")
class StructuredReview : BaseEntity() {
    @ManyToOne
    lateinit var reviewerArticle: ReviewerArticle

    var summaryNotes: String = ""
    var confidentialRemarks: String? = null

    @Enumerated(EnumType.STRING)
    var recommendation: ReviewRecommendation = ReviewRecommendation.BORDERLINE

    var submittedAt: LocalDateTime? = null
}
