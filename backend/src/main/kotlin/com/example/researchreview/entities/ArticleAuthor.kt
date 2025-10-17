package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "article_author")
class ArticleAuthor: BaseEntity() {
    @ManyToOne
    var article: Article = Article();

    @ManyToOne
    var author: Author = Author();

    var authorOrder: Int = 0;
}