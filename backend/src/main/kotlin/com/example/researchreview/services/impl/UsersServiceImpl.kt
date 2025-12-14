package com.example.researchreview.services.impl

import com.example.researchreview.constants.AccountStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.mappers.UserMapper
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.repositories.TrackRepository
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
    private val userMapper: UserMapper
): UsersService {

    @Transactional
    override fun getAll(pageable: Pageable): Page<UserDto> {
        val users = userRepository.findAll(pageable)
        val result = users.map { user ->
            userMapper.toDto(user)
        }
        return result
    }

    @Transactional
    override fun getById(id: String): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found with id: $id") }
        return userMapper.toDto(user)
    }

    @Transactional
    override fun getByEmail(email: String): UserDto? {
        val user = userRepository.findByEmail(email)
        return user?.let { userMapper.toDto(it) }
    }

    @Transactional
    override fun search(
        dto: UserRequestDto,
        pageable: Pageable
    ): Page<UserDto> {
        val users = userRepository.search(dto, pageable)
        val result = users.map { user ->
            userMapper.toDto(user)
        }
        return result
    }

    @Transactional
    override fun create(userDto: UserRequestDto): UserDto {
        // Validate role - don't allow creating ADMIN or EDITOR via this endpoint
        if (userDto.role.equals(Role.ADMIN.name) || userDto.role.equals(Role.EDITOR.name)) {
            throw IllegalArgumentException("Admin and Editor roles are not allowed for self-registration")
        }
        
        // Check if user already exists
        val existingUser = userRepository.findByEmail(userDto.email)
        if (existingUser != null) {
            throw IllegalArgumentException("User with email ${userDto.email} already exists")
        }
        
        // Create user entity from DTO
        val user = userMapper.toEntity(userDto)
        
        // Set institution
        val institution = institutionRepository.findById(userDto.institutionId)
            .orElseThrow { IllegalArgumentException("Institution not found with id: ${userDto.institutionId}") }
        user.institution = institution
        
        // Set track if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId)
                .orElseThrow { IllegalArgumentException("Track not found with id: $trackId") }
            user.track = track
        } else {
            user.track = null
        }
        
        // Set additional profile fields
        userMapper.stringToGender(userDto.gender)?.let { user.gender = it }
        user.nationality = userDto.nationality
        userMapper.stringToAcademicStatus(userDto.academicStatus)?.let { user.academicStatus = it }
        
        // Set user as active after completing profile
        user.status = AccountStatus.ACTIVE
        
        // Save and return
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun update(
        id: String,
        userDto: UserRequestDto
    ): UserDto {
        // Find existing user
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found with id: $id") }
        
        // Validate email hasn't changed or if changed, it's not taken
        if (userDto.email != user.email) {
            val existingUser = userRepository.findByEmail(userDto.email)
            if (existingUser != null && existingUser.id != id) {
                throw IllegalArgumentException("Email ${userDto.email} is already taken")
            }
            user.email = userDto.email
        }
        
        // Update basic fields
        user.name = userDto.name
        user.avatarId = userDto.avatarId
        
        // Update institution
        val institution = institutionRepository.findById(userDto.institutionId)
            .orElseThrow { IllegalArgumentException("Institution not found with id: ${userDto.institutionId}") }
        user.institution = institution
        
        // Update track if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId)
                .orElseThrow { IllegalArgumentException("Track not found with id: $trackId") }
            user.track = track
        } else {
            user.track = null
        }
        
        // Update profile fields
        userMapper.stringToGender(userDto.gender)?.let { user.gender = it }
        user.nationality = userDto.nationality
        userMapper.stringToAcademicStatus(userDto.academicStatus)?.let { user.academicStatus = it }
        
        // Save and return
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun updateRole(id: String, role: String, performedBy: Role): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found with id: $id") }
        
        val newRole = try {
            Role.valueOf(role)
        } catch (_: Exception) {
            throw IllegalArgumentException("Invalid role: $role. Valid roles are: ${Role.values().joinToString()}")
        }
        
        // Security check: Only allow ADMIN to assign ADMIN or EDITOR roles
        if ((newRole == Role.ADMIN || newRole == Role.EDITOR) && performedBy != Role.ADMIN) {
            throw IllegalArgumentException("Only ADMIN can assign ADMIN or EDITOR roles")
        }
        
        user.role = newRole
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun updateStatus(id: String, status: String): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found with id: $id") }
        
        val newStatus = try {
            AccountStatus.valueOf(status)
        } catch (_: Exception) {
            throw IllegalArgumentException("Invalid status: $status. Valid statuses are: ${AccountStatus.values().joinToString()}")
        }
        
        user.status = newStatus
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun delete(id: String) {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found with id: $id") }
        // Soft delete
        userRepository.deleteById(id)
    }
}