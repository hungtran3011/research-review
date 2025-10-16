package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode

@Entity
@Table(name = "editor")
@Audited
class Editor: BaseEntity() {
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @OneToOne
    var track: Track = Track();

    @OneToOne
    var user: User = User();
}