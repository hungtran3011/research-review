package com.example.researchreview.entities

import com.example.researchreview.constants.ArticleStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited

@Entity
@Table(name = "article")
class Article: BaseEntity() {
    var title: String = "";
    var status: ArticleStatus = ArticleStatus.SUBMITTED;
    @Audited
    var abstract: String = "";

    @Audited
    var conclusion: String = "";

    @Audited
    @Column(length = 2048)
    var link: String = "";

    @Audited
    var initialReviewNote: String? = null;

    @Audited
    var initialReviewNextSteps: String? = null;

    @ManyToOne
    var track: Track = Track();

//    @ManyToMany(mappedBy = "articles")
//    var authors: MutableList<Authors> = mutableListOf();
}