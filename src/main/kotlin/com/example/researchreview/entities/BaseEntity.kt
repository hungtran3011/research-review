package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String = "";

    var createdAt: Long = System.currentTimeMillis();
    var updatedAt: Long = System.currentTimeMillis();
    var createdBy: String = "";
    var updatedBy: String = "";
    var deleted: Boolean = false;
}