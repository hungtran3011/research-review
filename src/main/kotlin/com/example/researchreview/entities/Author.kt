package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne
import jakarta.persistence.Table

@Entity
@Table(name = "authors")
class Author: BaseEntity() {
    var name: String = "";

    @Column(unique = true)
    var email: String = "";

    @ManyToOne
    @JoinColumn(name = "institution_id")
    var institution: Institution = Institution();

    @OneToOne(mappedBy = "user")
    @JoinColumn(nullable = true, name = "user_id")
    var user: User? = null;

//    @ManyToMany
//    @JoinTable(name = "author_article",
//        joinColumns = [JoinColumn(name = "author_id")],
//        inverseJoinColumns = [JoinColumn(name = "article_id")]
//    )
//    var articles: MutableList<Article> = mutableListOf();
}