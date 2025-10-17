package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.Lob
import jakarta.persistence.Table

@Entity
@Table(name = "comment")
class Comment: BaseEntity() {
    @Lob
    var content: String = "";
}