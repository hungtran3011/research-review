package com.example.researchreview.entities

import com.example.researchreview.constants.ConferenceMembershipRole
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "user_conference_membership")
class UserConferenceMembership : BaseEntity() {
    @ManyToOne
    lateinit var user: User

    @ManyToOne
    lateinit var conference: Conference

    @Enumerated(EnumType.STRING)
    var membershipRole: ConferenceMembershipRole = ConferenceMembershipRole.PARTICIPANT
}
