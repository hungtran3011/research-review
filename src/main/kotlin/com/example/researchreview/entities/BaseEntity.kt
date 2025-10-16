package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import org.hibernate.envers.NotAudited

@MappedSuperclass
class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String = "";

    @NotAudited
    var createdAt: Long = System.currentTimeMillis();

    @NotAudited
    var updatedAt: Long = System.currentTimeMillis();

    @NotAudited
    var createdBy: String = "";

    @NotAudited
    var updatedBy: String = "";
    var deleted: Boolean = false;
}