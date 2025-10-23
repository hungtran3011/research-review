package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table

@Entity
@Table(name = "institution")
class Institution(
    @Column(nullable = false)
    var name: String = "",
    var website: String = "",
    var logo: String = "",
    var country: String = ""
): BaseEntity() {
    constructor() : this("", "", "", "")
}