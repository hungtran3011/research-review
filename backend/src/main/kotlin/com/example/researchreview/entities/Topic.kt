package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "topic")
class Topic : BaseEntity() {
    var name: String = ""
    var description: String? = null
    var isActive: Boolean = true
    var orderIndex: Int = 0

    @ManyToOne
    lateinit var conference: Conference

    @ManyToOne
    var track: Track? = null
}
