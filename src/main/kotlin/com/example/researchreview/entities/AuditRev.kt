package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.envers.DefaultRevisionEntity
import org.hibernate.envers.RevisionEntity

@Entity
@RevisionEntity
@Table(name = "revinfo")
class AuditRev: DefaultRevisionEntity() {
    var username: String = "";
}