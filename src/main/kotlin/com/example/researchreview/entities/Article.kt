package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited

@Entity
@Table(name = "article")
class Article: BaseEntity() {
    var title: String = "";
    @Audited
    var abstract: String = "";

    @Audited
    var conclusion: String = "";

    @Audited
    var link: String = "";

    @ManyToOne
    var track: Track = Track();

//    @ManyToMany(mappedBy = "articles")
//    var authors: MutableList<Authors> = mutableListOf();
}