package com.example.researchreview.entities

import com.example.researchreview.utils.SecurityUtils
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import org.hibernate.annotations.ColumnDefault
import org.hibernate.envers.NotAudited
import org.springframework.cglib.core.Local
import java.time.LocalDateTime

@MappedSuperclass
class BaseEntity {
    @Id
    @ColumnDefault("gen_random_uuid()") // For UUID generation in Postgres
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: String = "";

    @NotAudited
    var createdAt: LocalDateTime = LocalDateTime.now();

    @NotAudited
    var updatedAt: LocalDateTime = LocalDateTime.now();

    @NotAudited
    var createdBy: String = "";

    @NotAudited
    var updatedBy: String = "";
    var deleted: Boolean = false;

    @PrePersist
    fun prePersist(){
        val userId = SecurityUtils.currentUserId()
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
        createdBy = userId
        updatedBy = userId
    }

    @PreUpdate
    fun preUpdate(){
        updatedAt = LocalDateTime.now()
        updatedBy = SecurityUtils.currentUserId()
    }
}