package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode

@Entity
@Table(name = "reviewer")
class Reviewer: BaseEntity() {
    var name: String = "";

    @Column(unique = true)
    var email: String = "";

    @ManyToOne
    @JoinColumn(name = "institution_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var institution: Institution = Institution();

    @OneToOne
    @JoinColumn(nullable = true, name = "user_id")
    var user: User? = null;
}