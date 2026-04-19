package com.example.researchreview.services.impl

import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.dtos.ConferenceRegistrationResultDto
import com.example.researchreview.dtos.ConferenceMembershipDto
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.exceptions.BusinessLogicException
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.services.ConferenceRegistrationService
import com.example.researchreview.services.CurrentUserService
import jakarta.persistence.EntityNotFoundException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ConferenceRegistrationServiceImpl(
    private val currentUserService: CurrentUserService,
    private val conferenceRepository: ConferenceRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
) : ConferenceRegistrationService {

    @Transactional
    override fun register(conferenceId: String): ConferenceRegistrationResultDto {
        val currentUser = currentUserService.requireUser()
        if (currentUser.globalRole == GlobalRole.ADMIN) {
            throw AccessDeniedException("conference.registration.adminForbidden")
        }

        val conference = conferenceRepository.findByIdAndDeletedFalse(conferenceId)
            .orElseThrow { EntityNotFoundException("conference.notFound") }
        ensureConferenceOpenForRegistration(conference)

        val existingMembership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, currentUser.id)
            .orElse(null)
        if (existingMembership != null) {
            return ConferenceRegistrationResultDto(
                membership = toDto(existingMembership),
                created = false,
            )
        }

        val saved = userConferenceMembershipRepository.saveAndFlush(
            UserConferenceMembership().apply {
                user = currentUser
                this.conference = conference
                membershipRole = ConferenceMembershipRole.RESEARCHER
            }
        )
        return ConferenceRegistrationResultDto(
            membership = toDto(saved),
            created = true,
        )
    }

    private fun ensureConferenceOpenForRegistration(conference: Conference) {
        if (conference.status != ConferenceStatus.ACTIVE) {
            throw BusinessLogicException("conference.registration.closed")
        }
        val deadline = conference.submissionDeadline
        if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            throw BusinessLogicException("conference.registration.deadlinePassed")
        }
    }

    private fun toDto(membership: UserConferenceMembership): ConferenceMembershipDto {
        return ConferenceMembershipDto(
            id = membership.id,
            userId = membership.user.id,
            userName = membership.user.name,
            userEmail = membership.user.email,
            conferenceId = membership.conference.id,
            conferenceName = membership.conference.name,
            membershipRole = membership.membershipRole,
            createdAt = membership.createdAt,
            updatedAt = membership.updatedAt,
        )
    }
}
