package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.Table

@Entity
@Table(name = "tracks")
class Track: BaseEntity() {
    var name: String = "";
    var description: String = "";
    var isActive: Boolean = true;
}