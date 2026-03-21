package com.example.researchreview.services

import com.example.researchreview.constants.Role
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.AdminTopicConfigCreateRequestDto
import com.example.researchreview.dtos.AdminTopicConfigDto
import com.example.researchreview.dtos.AdminTopicConfigUpdateRequestDto
import com.example.researchreview.dtos.AdminTrackConfigCreateRequestDto
import com.example.researchreview.dtos.AdminTrackConfigDto
import com.example.researchreview.dtos.AdminTrackConfigUpdateRequestDto
import com.example.researchreview.dtos.ConferenceMembershipAssignRequestDto
import com.example.researchreview.dtos.ConferenceMembershipDto
import com.example.researchreview.dtos.ConferenceConfigCreateRequestDto
import com.example.researchreview.dtos.ConferenceConfigDto
import com.example.researchreview.dtos.ConferenceConfigSettingsPatchRequestDto
import com.example.researchreview.dtos.ConferenceConfigUpdateRequestDto
import com.example.researchreview.dtos.UserDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface AdminConfigurationService {
    fun getConferences(): List<ConferenceConfigDto>
    fun getConferenceById(conferenceId: String): ConferenceConfigDto
    fun createConference(request: ConferenceConfigCreateRequestDto): ConferenceConfigDto
    fun updateConference(conferenceId: String, request: ConferenceConfigUpdateRequestDto): ConferenceConfigDto
    fun patchConferenceSettings(conferenceId: String, request: ConferenceConfigSettingsPatchRequestDto): ConferenceConfigDto
    fun deleteConference(conferenceId: String)

    fun getTracks(conferenceId: String): List<AdminTrackConfigDto>
    fun createTrack(conferenceId: String, request: AdminTrackConfigCreateRequestDto): AdminTrackConfigDto
    fun updateTrack(conferenceId: String, trackId: String, request: AdminTrackConfigUpdateRequestDto): AdminTrackConfigDto
    fun deleteTrack(conferenceId: String, trackId: String)

    fun getTopics(conferenceId: String, trackId: String?): List<AdminTopicConfigDto>
    fun createTopic(conferenceId: String, request: AdminTopicConfigCreateRequestDto): AdminTopicConfigDto
    fun updateTopic(conferenceId: String, topicId: String, request: AdminTopicConfigUpdateRequestDto): AdminTopicConfigDto
    fun deleteTopic(conferenceId: String, topicId: String)

    fun getUsers(pageable: Pageable): Page<UserDto>
    fun searchUsers(
        name: String?,
        email: String?,
        institutionName: String?,
        role: String?,
        status: String?,
        pageable: Pageable,
    ): Page<UserDto>
    fun createUser(request: AdminCreateUserRequestDto): UserDto
    fun updateUserRole(userId: String, role: String, performedBy: Role): UserDto
    fun updateUserStatus(userId: String, status: String): UserDto
    fun deleteUser(userId: String)

    fun getConferenceMembers(conferenceId: String): List<ConferenceMembershipDto>
    fun assignConferenceMember(conferenceId: String, request: ConferenceMembershipAssignRequestDto): ConferenceMembershipDto
    fun removeConferenceMember(conferenceId: String, userId: String)
}
