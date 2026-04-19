package com.example.researchreview.services.impl

import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.User
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.exceptions.BusinessLogicException
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.services.CurrentUserService
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.security.access.AccessDeniedException
import java.util.Optional

class ConferenceRegistrationServiceImplTest {

    private val currentUserService: CurrentUserService = mock()
    private val conferenceRepository: ConferenceRepository = mock()
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository = mock()

    private lateinit var service: ConferenceRegistrationServiceImpl

    @BeforeEach
    fun setUp() {
        service = ConferenceRegistrationServiceImpl(
            currentUserService = currentUserService,
            conferenceRepository = conferenceRepository,
            userConferenceMembershipRepository = userConferenceMembershipRepository,
        )
    }

    @Test
    fun `register creates researcher membership when conference is open and user not registered`() {
        val user = user("u-1", GlobalRole.USER)
        val conference = conference("c-1", ConferenceStatus.ACTIVE)
        whenever(currentUserService.requireUser()).thenReturn(user)
        whenever(conferenceRepository.findByIdAndDeletedFalse("c-1")).thenReturn(Optional.of(conference))
        whenever(userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-1", "u-1"))
            .thenReturn(Optional.empty())
        whenever(userConferenceMembershipRepository.saveAndFlush(any<UserConferenceMembership>()))
            .thenAnswer { invocation -> invocation.arguments[0] as UserConferenceMembership }

        val result = service.register("c-1")

        assertEquals(true, result.created)
        assertEquals(ConferenceMembershipRole.RESEARCHER, result.membership.membershipRole)
    }

    @Test
    fun `register returns existing membership when user already registered`() {
        val user = user("u-2", GlobalRole.USER)
        val conference = conference("c-2", ConferenceStatus.ACTIVE)
        val membership = membership(user, conference, ConferenceMembershipRole.RESEARCHER)
        whenever(currentUserService.requireUser()).thenReturn(user)
        whenever(conferenceRepository.findByIdAndDeletedFalse("c-2")).thenReturn(Optional.of(conference))
        whenever(userConferenceMembershipRepository.findByConferenceIdAndUserIdAndDeletedFalse("c-2", "u-2"))
            .thenReturn(Optional.of(membership))

        val result = service.register("c-2")

        assertFalse(result.created)
        assertEquals(membership.membershipRole, result.membership.membershipRole)
    }

    @Test
    fun `register denies admin users`() {
        val admin = user("u-admin", GlobalRole.ADMIN)
        whenever(currentUserService.requireUser()).thenReturn(admin)

        assertThrows(AccessDeniedException::class.java) {
            service.register("c-3")
        }
    }

    @Test
    fun `register rejects closed conferences`() {
        val user = user("u-3", GlobalRole.USER)
        val conference = conference("c-4", ConferenceStatus.CLOSED)
        whenever(currentUserService.requireUser()).thenReturn(user)
        whenever(conferenceRepository.findByIdAndDeletedFalse("c-4")).thenReturn(Optional.of(conference))

        assertThrows(BusinessLogicException::class.java) {
            service.register("c-4")
        }
    }

    private fun user(id: String, role: GlobalRole): User {
        return User().apply {
            this.id = id
            this.email = "$id@example.com"
            this.name = id
            this.globalRole = role
        }
    }

    private fun conference(id: String, status: ConferenceStatus): Conference {
        return Conference().apply {
            this.id = id
            this.name = id
            this.shortName = id
            this.status = status
        }
    }

    private fun membership(user: User, conference: Conference, role: ConferenceMembershipRole): UserConferenceMembership {
        return UserConferenceMembership().apply {
            this.user = user
            this.conference = conference
            this.membershipRole = role
        }
    }
}
