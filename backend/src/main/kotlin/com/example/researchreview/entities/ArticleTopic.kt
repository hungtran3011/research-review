package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "article_topic")
class ArticleTopic : BaseEntity() {
    @ManyToOne
    lateinit var article: Article

    @ManyToOne
    lateinit var topic: Topic
}
