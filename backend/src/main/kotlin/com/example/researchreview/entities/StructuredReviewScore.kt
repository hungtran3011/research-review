package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "structured_review_score")
class StructuredReviewScore : BaseEntity() {
    @ManyToOne
    lateinit var structuredReview: StructuredReview

    var criterion: String = ""
    var score: Int = 0
}
