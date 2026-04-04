package com.example.researchreview.services.impl

import com.example.researchreview.constants.AccountStatus
import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.Role
import com.example.researchreview.constants.AcademicStatus
import com.example.researchreview.constants.Gender
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.ConferenceMembershipDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.dtos.UserSearchRequestDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.entities.Editor
import com.example.researchreview.entities.UserRole
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.services.ReviewerInviteService
import com.example.researchreview.services.UsersService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UsersServiceImpl(
    private val userRepository: UserRepository,
    private val institutionRepository: InstitutionRepository,
    private val trackRepository: TrackRepository,
    private val editorRepository: EditorRepository,
    private val reviewerRepository: ReviewerRepository,
    private val userConferenceMembershipRepository: UserConferenceMembershipRepository,
    private val reviewerInviteService: ReviewerInviteService
): UsersService {

    @Transactional
    override fun createByAdmin(dto: AdminCreateUserRequestDto): UserDto {
        val email = dto.email.trim().lowercase()
        if (email.isBlank()) {
            throw IllegalArgumentException("users.emailRequired")
        }

        val existingUser = userRepository.findByEmail(email)
        if (existingUser != null) {
            throw IllegalArgumentException("users.emailAlreadyExists")
        }

        val role = try {
            Role.valueOf(dto.role.trim())
        } catch (_: Exception) {
            throw IllegalArgumentException("users.invalidRole")
        }

        val trackId = dto.trackId?.trim().orEmpty()
        if (role == Role.EDITOR && trackId.isBlank()) {
            throw IllegalArgumentException("users.trackRequiredForEditor")
        }

        val user = com.example.researchreview.entities.User().apply {
            name = dto.name.trim()
            this.email = email
            this.role = role
            avatarId = dto.avatarId
            status = AccountStatus.ACTIVE
        }
        applyRoles(user, listOf(role))

        val institutionId = dto.institutionId?.trim().orEmpty()
        if (institutionId.isNotBlank()) {
            val institution = institutionRepository.findById(institutionId)
                .orElseThrow { IllegalArgumentException("institution.notFound") }
            user.institution = institution
        } else {
            user.institution = null
        }

        val track = if (trackId.isNotBlank()) {
            trackRepository.findById(trackId)
                .orElseThrow { IllegalArgumentException("users.trackNotFound") }
        } else {
            null
        }
        user.track = track

        val savedUser = userRepository.save(user)

        if (role == Role.EDITOR) {
            val ensuredTrack = track
                ?: throw IllegalStateException("users.trackRequiredForEditor")

            val existingAssignment = editorRepository
                .findByUserIdAndTrackIdAndDeletedFalse(savedUser.id, ensuredTrack.id)
            if (existingAssignment.isEmpty) {
                val editor = Editor().apply {
                    this.user = savedUser
                    this.track = ensuredTrack
                }
                editorRepository.save(editor)
            }
        }

        return toDto(savedUser)
    }

    @Transactional
    override fun getAll(pageable: Pageable): Page<UserDto> {
        val users = userRepository.findAll(pageable)
        return users.map { user -> toDto(user) }
    }

    @Transactional
    override fun getById(id: String): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("user.notFound") }
        return toDto(user)
    }

    @Transactional
    override fun getByEmail(email: String): UserDto? {
        val user = userRepository.findByEmail(email)
        return user?.let { toDto(it) }
    }

    @Transactional
    override fun search(
        name: String?,
        email: String?,
        institutionName: String?,
        role: String?,
        status: String?,
        pageable: Pageable
    ): Page<UserDto> {
        val normalizedRole = role?.trim()?.takeIf { it.isNotBlank() }
        val normalizedStatus = status?.trim()?.takeIf { it.isNotBlank() }

        val roleOrdinal = try {
            if (normalizedRole == null) null else Role.valueOf(normalizedRole).value.toInt()
        } catch (_: Exception) {
            null
        }

        val statusOrdinal = try {
            if (normalizedStatus == null) null else AccountStatus.valueOf(normalizedStatus).value.toInt()
        } catch (_: Exception) {
            null
        }
        // Prepare prefix tsquery terms; keep null when filter not provided so query short-circuits
        val emailQuery = toPrefixTsQuery(email)
        val nameQuery = toPrefixTsQuery(name)
        val institutionQuery = toPrefixTsQuery(institutionName)

        val users = userRepository.search(
            emailQuery = emailQuery,
            nameQuery = nameQuery,
            institutionQuery = institutionQuery,
            role = normalizedRole,
            roleOrdinal = roleOrdinal,
            status = normalizedStatus,
            statusOrdinal = statusOrdinal,
            pageable = pageable
        )
        return users.map { user -> toDto(user) }
    }

    @Transactional
    override fun create(userDto: UserRequestDto): UserDto {
        // If invite token is provided, force email based on token and mark token used.
        // The caller's chosen role remains the primary role, but REVIEWER will be added.
        val inviteToken = userDto.inviteToken?.trim().orEmpty()
        var addReviewerRole = false
        if (inviteToken.isNotBlank()) {
            // Do NOT consume the invite here.
            // The reviewer still needs to accept/decline the review invitation after completing signup.
            val invite = reviewerInviteService.resolve(inviteToken)
            userDto.email = invite.email
            addReviewerRole = true
        }

        // Validate role - don't allow creating ADMIN or EDITOR via this endpoint
        if (userDto.role.equals(Role.ADMIN.name) || userDto.role.equals(Role.EDITOR.name)) {
            throw IllegalArgumentException("users.selfRegistrationRoleForbidden")
        }

        // Check if user already exists
        val existingUser = userRepository.findByEmail(userDto.email)
        if (existingUser != null) {
            throw IllegalArgumentException("users.emailAlreadyExists")
        }

        // Create user entity from DTO
        val user = toEntity(userDto)

        // Persist multi-role set (always includes primary role)
        val assignedRoles = buildList {
            add(user.role)
            if (addReviewerRole) add(Role.REVIEWER)
        }
        applyRoles(user, assignedRoles)

        // Set institution
        val institution = institutionRepository.findById(userDto.institutionId)
            .orElseThrow { IllegalArgumentException("institution.notFound") }
        user.institution = institution

        // Set track if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId)
                .orElseThrow { IllegalArgumentException("users.trackNotFound") }
            user.track = track
        } else {
            user.track = null
        }

        // Set additional profile fields
        if (!userDto.gender.isNullOrBlank()) user.gender = Gender.valueOf(userDto.gender!!)
        user.nationality = userDto.nationality
        if (!userDto.academicStatus.isNullOrBlank()) user.academicStatus = AcademicStatus.valueOf(userDto.academicStatus!!)

        // Set user as active after completing profile
        user.status = AccountStatus.ACTIVE

        // Save and return
        val savedUser = userRepository.save(user)

        // If reviewer signed up through an invite, link the Reviewer entity (if exists) to this User.
        if (savedUser.hasRole(Role.REVIEWER)) {
            val reviewer = reviewerRepository.findByEmail(userDto.email)
            if (reviewer != null && reviewer.user == null) {
                reviewer.user = savedUser
                reviewerRepository.save(reviewer)
            }
        }
        return toDto(savedUser)
    }

    @Transactional
    override fun update(
        id: String,
        userDto: UserRequestDto
    ): UserDto {
        // Find existing user
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("user.notFound") }
        
        // Validate email hasn't changed or if changed, it's not taken
        if (userDto.email != user.email) {
            val existingUser = userRepository.findByEmail(userDto.email)
            if (existingUser != null && existingUser.id != id) {
                throw IllegalArgumentException("users.emailAlreadyTaken")
            }
            user.email = userDto.email
        }
        
        // Update basic fields
        user.name = userDto.name
        user.avatarId = userDto.avatarId
        
        // Update institution
        val institution = institutionRepository.findById(userDto.institutionId)
            .orElseThrow { IllegalArgumentException("institution.notFound") }
        user.institution = institution
        
        // Update track if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId)
                .orElseThrow { IllegalArgumentException("users.trackNotFound") }
            user.track = track
        } else {
            user.track = null
        }
        
        // Update profile fields
        if (!userDto.gender.isNullOrBlank()) user.gender = Gender.valueOf(userDto.gender!!)
        user.nationality = userDto.nationality
        if (!userDto.academicStatus.isNullOrBlank()) user.academicStatus = AcademicStatus.valueOf(userDto.academicStatus!!)
        
        // Save and return
        val savedUser = userRepository.save(user)
        return toDto(savedUser)
    }

    @Transactional
    override fun updateRole(id: String, role: String, performedBy: Role): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("user.notFound") }
        
        val newRole = try {
            Role.valueOf(role)
        } catch (_: Exception) {
            throw IllegalArgumentException("users.invalidRole")
        }
        
        // Security check: Only allow ADMIN to assign ADMIN or EDITOR roles
        if ((newRole == Role.ADMIN || newRole == Role.EDITOR) && performedBy != Role.ADMIN) {
            throw IllegalArgumentException("users.onlyAdminCanAssignAdminEditor")
        }
        
        user.role = newRole
        // Admin explicitly sets the user's role: reset roles to exactly that role.
        applyRoles(user, listOf(newRole))
        val savedUser = userRepository.save(user)
        return toDto(savedUser)
    }

    @Transactional
    override fun updateStatus(id: String, status: String): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("user.notFound") }
        
        val newStatus = try {
            AccountStatus.valueOf(status)
        } catch (_: Exception) {
            throw IllegalArgumentException("users.invalidStatus")
        }
        
        user.status = newStatus
        val savedUser = userRepository.save(user)
        return toDto(savedUser)
    }

    private fun toDto(user: com.example.researchreview.entities.User): UserDto {
        val memberships = userConferenceMembershipRepository.findAllByUserIdAndDeletedFalse(user.id)
        return UserDto(
            id = user.id,
            name = user.name,
            role = user.role.name,
            roles = user.effectiveRoles.map { it.name },
            email = user.email,
            avatarId = user.avatarId,
            institution = user.institution?.let {
                InstitutionDto(
                    id = it.id,
                    name = it.name,
                    country = it.country,
                    website = it.website,
                    logo = it.logo
                )
            },
            track = user.track?.let {
                TrackDto(
                    id = it.id,
                    name = it.name,
                    editors = emptyList(),
                    description = it.description,
                    isActive = it.isActive,
                    createdAt = it.createdAt,
                    updatedAt = it.updatedAt,
                    createdBy = it.createdBy,
                    updatedBy = it.updatedBy
                )
            },
            conferences = memberships.map {
                ConferenceMembershipDto(
                    id = it.id,
                    userId = user.id,
                    userName = user.name,
                    userEmail = user.email,
                    conferenceId = it.conference.id,
                    conferenceName = it.conference.name,
                    membershipRole = it.membershipRole,
                    createdAt = it.createdAt,
                    updatedAt = it.updatedAt,
                )
            },
            gender = user.gender,
            nationality = user.nationality,
            academicStatus = user.academicStatus,
            status = user.status.name,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt,
            createdBy = user.createdBy,
            updatedBy = user.updatedBy
        )
    }

    private fun applyRoles(user: com.example.researchreview.entities.User, roles: Collection<Role>) {
        user.roles.clear()
        roles.forEach { r ->
            val ur = UserRole()
            ur.user = user
            ur.role = r
            user.roles.add(ur)
        }
    }

    private fun toPrefixTsQuery(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val normalized = raw
            .trim()
            .lowercase()
            .replace(Regex("[^\\p{L}\\p{N}]+"), " ")
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
        if (normalized.isEmpty()) return null
        return normalized.joinToString(" & ") { "$it:*" }
    }

    private fun toEntity(dto: UserRequestDto): com.example.researchreview.entities.User {
        return com.example.researchreview.entities.User().apply {
            name = dto.name
            email = dto.email
            role = Role.valueOf(dto.role)
            avatarId = dto.avatarId
            nationality = dto.nationality
            if (!dto.gender.isNullOrBlank()) gender = Gender.valueOf(dto.gender!!)
            if (!dto.academicStatus.isNullOrBlank()) academicStatus = AcademicStatus.valueOf(dto.academicStatus!!)
        }
    }

    @Transactional
    override fun delete(id: String) {
        val user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow { IllegalArgumentException("user.notFound") }
        // Soft delete via repository override
        userRepository.deleteById(user.id)
        editorRepository.findAllByUserIdAndDeletedFalse(user.id).forEach {
            editorRepository.deleteById(it.id)
        }
    }
}