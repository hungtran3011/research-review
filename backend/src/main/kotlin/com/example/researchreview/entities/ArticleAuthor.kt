package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "article_author")
class ArticleAuthor: BaseEntity() {
    @ManyToOne
    @JoinColumn(name = "article_id", nullable = false)
    lateinit var article: Article

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    lateinit var author: Author

    var authorOrder: Int = 0
}