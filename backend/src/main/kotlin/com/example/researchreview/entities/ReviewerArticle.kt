package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "reviewer_article")
class ReviewerArticle: BaseEntity() {
    @ManyToOne
    var reviewer: Reviewer = Reviewer();

    @ManyToOne
    var article: Article = Article();

}