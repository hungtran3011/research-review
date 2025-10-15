package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "articles")
class Article: BaseEntity() {
    var title: String = "";
    var abstract: String = "";
    var conclusion: String = "";
    var link: String = "";

    @ManyToOne
    var track: Track = Track();

//    @ManyToMany(mappedBy = "articles")
//    var authors: MutableList<Authors> = mutableListOf();
}