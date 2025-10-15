package com.example.researchreview.entities

class ReviewerArticle: BaseEntity() {
    var reviewer: Reviewer = Reviewer();
    var article: Article = Article();

}