package com.example.researchreview.repositories

import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.entities.UserConferenceMembership
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface UserConferenceMembershipRepository : JpaRepository<UserConferenceMembership, String> {
    fun findAllByConferenceIdAndDeletedFalse(conferenceId: String): List<UserConferenceMembership>
    fun findAllByUserIdAndDeletedFalse(userId: String): List<UserConferenceMembership>
    fun findAllByConferenceIdAndMembershipRoleAndDeletedFalse(conferenceId: String, membershipRole: ConferenceMembershipRole): List<UserConferenceMembership>
    fun findByConferenceIdAndUserIdAndDeletedFalse(conferenceId: String, userId: String): Optional<UserConferenceMembership>
}
