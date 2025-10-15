package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne

class Reviewer {
    var name: String = "";

    @Column(unique = true)
    var email: String = "";

    @ManyToOne
    @JoinColumn(name = "institution_id")
    var institution: Institution = Institution();

    @OneToOne(mappedBy = "user")
    @JoinColumn(nullable = true, name = "user_id")
    var user: Users? = null;
}