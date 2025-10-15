package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table

@Entity
@Table(name = "reviewers")
class Reviewer: BaseEntity() {
    var name: String = "";

    @Column(unique = true)
    var email: String = "";

    @ManyToOne
    @JoinColumn(name = "institution_id")
    var institution: Institution = Institution();

    @OneToOne(mappedBy = "user")
    @JoinColumn(nullable = true, name = "user_id")
    var user: User? = null;
}