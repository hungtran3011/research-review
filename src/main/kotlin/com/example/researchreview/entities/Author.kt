package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode

@Entity
@Table(name = "author")
class Author: BaseEntity() {
    var name: String = "";

    @Column(unique = true)
    var email: String = "";

    @ManyToOne
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @JoinColumn(name = "institution_id")
    var institution: Institution = Institution();

    @OneToOne
    @JoinColumn(nullable = true, name = "user_id")
    var user: User? = null;

//    @ManyToMany
//    @JoinTable(name = "author_article",
//        joinColumns = [JoinColumn(name = "author_id")],
//        inverseJoinColumns = [JoinColumn(name = "article_id")]
//    )
//    var articles: MutableList<Article> = mutableListOf();
}