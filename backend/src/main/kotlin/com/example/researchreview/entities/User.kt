package com.example.researchreview.entities

import com.example.researchreview.constants.AccountStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.constants.Gender
import com.example.researchreview.constants.AcademicStatus
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode

@Entity
@Table(name = "users")
@Audited
class User: BaseEntity() {

    var name: String = ""
    var email: String = ""
    var role: Role = Role.USER
    var avatarId: String? = null
    var status: AccountStatus = AccountStatus.INACTIVE

    // new fields to align with UserDto
    var gender: Gender? = null
    var nationality: String = ""
    var academicStatus: AcademicStatus = AcademicStatus.TS

    @ManyToOne
    @JoinColumn(name = "institution_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var institution: Institution? = null

    @ManyToOne
    @JoinColumn(name = "track_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var track: Track? = null
}