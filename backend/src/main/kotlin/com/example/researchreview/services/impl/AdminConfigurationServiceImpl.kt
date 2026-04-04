package com.example.researchreview.services.impl

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
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.Topic
import com.example.researchreview.entities.Track
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.exceptions.BusinessLogicException
import com.example.researchreview.exceptions.ResourceNotFoundException
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.TopicRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.AdminConfigurationService
import com.example.researchreview.services.UsersService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminConfigurationServiceImpl(
    private val conferenceRepository: ConferenceRepository,
    private val trackRepository: TrackRepository,
    private val topicRepository: TopicRepository,
    private val userRepository: UserRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
    private val usersService: UsersService,
) : AdminConfigurationService {

    companion object {
        private const val MIN_COMPLETED_REVIEWS_MIN = 1
        private const val MIN_COMPLETED_REVIEWS_MAX = 20
    }

    @Transactional(readOnly = true)
    override fun getConferences(): List<ConferenceConfigDto> {
        return conferenceRepository.findAllByDeletedFalse().map { toConferenceDto(it) }
    }

    @Transactional(readOnly = true)
    override fun getConferenceById(conferenceId: String): ConferenceConfigDto {
        return toConferenceDto(findConferenceOrThrow(conferenceId))
    }

    @Transactional
    override fun createConference(request: ConferenceConfigCreateRequestDto): ConferenceConfigDto {
        validateConferenceShortName(request.shortName)
        validateReviewThreshold("minimumCompletedReviews", request.minimumCompletedReviews)

        val saved = conferenceRepository.save(
            Conference().apply {
                name = request.name.trim()
                shortName = request.shortName.trim()
                season = request.season?.trim()?.ifBlank { null }
                year = request.year
                description = request.description?.trim()?.ifBlank { null }
                status = request.status
                submissionDeadline = request.submissionDeadline
                minimumCompletedReviews = request.minimumCompletedReviews
            }
        )

        return toConferenceDto(saved)
    }

    @Transactional
    override fun updateConference(conferenceId: String, request: ConferenceConfigUpdateRequestDto): ConferenceConfigDto {
        validateConferenceShortName(request.shortName, conferenceId)
        validateReviewThreshold("minimumCompletedReviews", request.minimumCompletedReviews)

        val conference = findConferenceOrThrow(conferenceId)
        conference.name = request.name.trim()
        conference.shortName = request.shortName.trim()
        conference.season = request.season?.trim()?.ifBlank { null }
        conference.year = request.year
        conference.description = request.description?.trim()?.ifBlank { null }
        conference.status = request.status
        conference.submissionDeadline = request.submissionDeadline
        conference.minimumCompletedReviews = request.minimumCompletedReviews

        return toConferenceDto(conference)
    }

    @Transactional
    override fun patchConferenceSettings(
        conferenceId: String,
        request: ConferenceConfigSettingsPatchRequestDto,
    ): ConferenceConfigDto {
        val conference = findConferenceOrThrow(conferenceId)

        request.status?.let { conference.status = it }
        if (request.submissionDeadline != null) {
            conference.submissionDeadline = request.submissionDeadline
        }
        request.minimumCompletedReviews?.let {
            validateReviewThreshold("minimumCompletedReviews", it)
            conference.minimumCompletedReviews = it
        }

        return toConferenceDto(conference)
    }

    @Transactional
    override fun deleteConference(conferenceId: String) {
        val conference = findConferenceOrThrow(conferenceId)
        conference.deleted = true
    }

    @Transactional(readOnly = true)
    override fun getTracks(conferenceId: String): List<AdminTrackConfigDto> {
        findConferenceOrThrow(conferenceId)
        return trackRepository.findAllByConferenceIdAndDeletedFalse(conferenceId).map { toTrackDto(it) }
    }

    @Transactional
    override fun createTrack(conferenceId: String, request: AdminTrackConfigCreateRequestDto): AdminTrackConfigDto {
        val conference = findConferenceOrThrow(conferenceId)
        request.reviewPolicyMinCompletedReviews?.let {
            validateReviewThreshold("reviewPolicyMinCompletedReviews", it)
        }

        val saved = trackRepository.save(
            Track().apply {
                name = request.name.trim()
                description = request.description?.trim()?.ifBlank { null }
                isActive = request.isActive
                reviewPolicyMinCompletedReviews = request.reviewPolicyMinCompletedReviews
                this.conference = conference
            }
        )

        return toTrackDto(saved)
    }

    @Transactional
    override fun updateTrack(
        conferenceId: String,
        trackId: String,
        request: AdminTrackConfigUpdateRequestDto,
    ): AdminTrackConfigDto {
        val conference = findConferenceOrThrow(conferenceId)
        val track = findTrackOrThrow(conference.id, trackId)
        request.reviewPolicyMinCompletedReviews?.let {
            validateReviewThreshold("reviewPolicyMinCompletedReviews", it)
        }

        track.name = request.name.trim()
        track.description = request.description?.trim()?.ifBlank { null }
        track.isActive = request.isActive
        track.reviewPolicyMinCompletedReviews = request.reviewPolicyMinCompletedReviews

        return toTrackDto(track)
    }

    @Transactional
    override fun deleteTrack(conferenceId: String, trackId: String) {
        findConferenceOrThrow(conferenceId)
        val track = findTrackOrThrow(conferenceId, trackId)
        track.deleted = true
    }

    @Transactional(readOnly = true)
    override fun getTopics(conferenceId: String, trackId: String?): List<AdminTopicConfigDto> {
        findConferenceOrThrow(conferenceId)
        val topics = if (trackId.isNullOrBlank()) {
            topicRepository.findAllByConferenceIdAndDeletedFalseOrderByOrderIndexAsc(conferenceId)
        } else {
            findTrackOrThrow(conferenceId, trackId)
            topicRepository.findAllByConferenceIdAndTrackIdAndDeletedFalseOrderByOrderIndexAsc(conferenceId, trackId)
        }
        return topics.map { toTopicDto(it) }
    }

    @Transactional
    override fun createTopic(conferenceId: String, request: AdminTopicConfigCreateRequestDto): AdminTopicConfigDto {
        val conference = findConferenceOrThrow(conferenceId)
        val track = request.trackId?.trim()?.takeIf { it.isNotBlank() }?.let { findTrackOrThrow(conferenceId, it) }

        val saved = topicRepository.save(
            Topic().apply {
                name = request.name.trim()
                description = request.description?.trim()?.ifBlank { null }
                isActive = request.isActive
                orderIndex = request.orderIndex
                this.conference = conference
                this.track = track
            }
        )

        return toTopicDto(saved)
    }

    @Transactional
    override fun updateTopic(
        conferenceId: String,
        topicId: String,
        request: AdminTopicConfigUpdateRequestDto,
    ): AdminTopicConfigDto {
        findConferenceOrThrow(conferenceId)
        val topic = findTopicOrThrow(conferenceId, topicId)
        val track = request.trackId?.trim()?.takeIf { it.isNotBlank() }?.let { findTrackOrThrow(conferenceId, it) }

        topic.name = request.name.trim()
        topic.description = request.description?.trim()?.ifBlank { null }
        topic.isActive = request.isActive
        topic.orderIndex = request.orderIndex
        topic.track = track

        return toTopicDto(topic)
    }

    @Transactional
    override fun deleteTopic(conferenceId: String, topicId: String) {
        findConferenceOrThrow(conferenceId)
        val topic = findTopicOrThrow(conferenceId, topicId)
        topic.deleted = true
    }

    @Transactional(readOnly = true)
    override fun getUsers(pageable: Pageable): Page<UserDto> {
        return usersService.getAll(pageable)
    }

    @Transactional(readOnly = true)
    override fun searchUsers(
        name: String?,
        email: String?,
        institutionName: String?,
        role: String?,
        status: String?,
        pageable: Pageable,
    ): Page<UserDto> {
        return usersService.search(name, email, institutionName, role, status, pageable)
    }

    @Transactional
    override fun createUser(request: AdminCreateUserRequestDto): UserDto {
        return usersService.createByAdmin(request)
    }

    @Transactional
    override fun updateUserRole(userId: String, role: String, performedBy: Role): UserDto {
        return usersService.updateRole(userId, role, performedBy)
    }

    @Transactional
    override fun updateUserStatus(userId: String, status: String): UserDto {
        return usersService.updateStatus(userId, status)
    }

    @Transactional
    override fun deleteUser(userId: String) {
        usersService.delete(userId)
    }

    @Transactional(readOnly = true)
    override fun getConferenceMembers(conferenceId: String): List<ConferenceMembershipDto> {
        findConferenceOrThrow(conferenceId)
        return userConferenceMembershipRepository.findAllByConferenceIdAndDeletedFalse(conferenceId)
            .map { toConferenceMembershipDto(it) }
    }

    @Transactional
    override fun assignConferenceMember(
        conferenceId: String,
        request: ConferenceMembershipAssignRequestDto,
    ): ConferenceMembershipDto {
        val conference = findConferenceOrThrow(conferenceId)
        val user = userRepository.findByIdAndDeletedFalse(request.userId)
            .orElseThrow { ResourceNotFoundException("user.notFound") }

        val existing = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, request.userId)
            .orElse(null)

        val membership = if (existing != null) {
            existing.membershipRole = request.membershipRole
            existing
        } else {
            UserConferenceMembership().apply {
                this.user = user
                this.conference = conference
                this.membershipRole = request.membershipRole
            }
        }

        val saved = userConferenceMembershipRepository.save(membership)
        return toConferenceMembershipDto(saved)
    }

    @Transactional
    override fun removeConferenceMember(conferenceId: String, userId: String) {
        findConferenceOrThrow(conferenceId)
        val membership = userConferenceMembershipRepository
            .findByConferenceIdAndUserIdAndDeletedFalse(conferenceId, userId)
            .orElseThrow { ResourceNotFoundException("conferenceMembership.notFound") }
        membership.deleted = true
    }

    private fun findConferenceOrThrow(conferenceId: String): Conference {
        return conferenceRepository.findByIdAndDeletedFalse(conferenceId)
            .orElseThrow { ResourceNotFoundException("conference.notFound") }
    }

    private fun findTrackOrThrow(conferenceId: String, trackId: String): Track {
        return trackRepository.findByIdAndConferenceIdAndDeletedFalse(trackId, conferenceId)
            .orElseThrow { ResourceNotFoundException("track.notFoundInConference") }
    }

    private fun findTopicOrThrow(conferenceId: String, topicId: String): Topic {
        return topicRepository.findByIdAndConferenceIdAndDeletedFalse(topicId, conferenceId)
            .orElseThrow { ResourceNotFoundException("topic.notFoundInConference") }
    }

    private fun validateConferenceShortName(shortName: String, idToExclude: String? = null) {
        val normalized = shortName.trim()
        if (normalized.isBlank()) {
            throw BusinessLogicException("conference.shortNameRequired")
        }

        val exists = if (idToExclude == null) {
            conferenceRepository.existsByShortNameIgnoreCaseAndDeletedFalse(normalized)
        } else {
            conferenceRepository.existsByShortNameIgnoreCaseAndDeletedFalseAndIdNot(normalized, idToExclude)
        }

        if (exists) {
            throw BusinessLogicException("conference.shortNameAlreadyExists")
        }
    }

    private fun validateReviewThreshold(fieldName: String, value: Int) {
        if (value < MIN_COMPLETED_REVIEWS_MIN || value > MIN_COMPLETED_REVIEWS_MAX) {
            throw BusinessLogicException(
                when (fieldName) {
                    "reviewPolicyMinCompletedReviews" -> "track.reviewPolicyMinCompletedReviewsOutOfRange"
                    else -> "conference.minimumCompletedReviewsOutOfRange"
                }
            )
        }
    }

    private fun toConferenceDto(conference: Conference): ConferenceConfigDto {
        return ConferenceConfigDto(
            id = conference.id,
            name = conference.name,
            shortName = conference.shortName,
            season = conference.season,
            year = conference.year,
            description = conference.description,
            status = conference.status,
            submissionDeadline = conference.submissionDeadline,
            minimumCompletedReviews = conference.minimumCompletedReviews,
            createdAt = conference.createdAt,
            updatedAt = conference.updatedAt,
        )
    }

    private fun toTrackDto(track: Track): AdminTrackConfigDto {
        return AdminTrackConfigDto(
            id = track.id,
            conferenceId = track.conference?.id
                ?: throw BusinessLogicException("track.conferenceLinkMissing"),
            name = track.name,
            description = track.description,
            isActive = track.isActive,
            reviewPolicyMinCompletedReviews = track.reviewPolicyMinCompletedReviews,
            createdAt = track.createdAt,
            updatedAt = track.updatedAt,
        )
    }

    private fun toTopicDto(topic: Topic): AdminTopicConfigDto {
        return AdminTopicConfigDto(
            id = topic.id,
            conferenceId = topic.conference.id,
            trackId = topic.track?.id,
            name = topic.name,
            description = topic.description,
            isActive = topic.isActive,
            orderIndex = topic.orderIndex,
            createdAt = topic.createdAt,
            updatedAt = topic.updatedAt,
        )
    }

    private fun toConferenceMembershipDto(membership: UserConferenceMembership): ConferenceMembershipDto {
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
