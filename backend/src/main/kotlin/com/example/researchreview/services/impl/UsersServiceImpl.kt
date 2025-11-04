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
        val user = userRepository.findById(id).orElseThrow { Exception("User not found") }
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
        if (userDto.role.equals("ADMIN") or userDto.role.equals("EDITOR")) throw Exception("Admin and Editor roles are not allowed")
        val user = userMapper.toEntity(userDto)
        val institution = institutionRepository.findById(userDto.institutionId).orElseThrow { Exception("Institution not found") }
        user.institution = institution
        // Resolve track from repository if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId).orElseThrow { Exception("Track not found") }
            user.track = track
        } else {
            user.track = null
        }
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun update(
        id: String,
        userDto: UserRequestDto
    ): UserDto {
        // temp, will be replaced by authenticated user's id'
        val user = userRepository.findById(id).orElseThrow { Exception("User not found") }
        val institution = institutionRepository.findById(userDto.institutionId).orElseThrow { Exception("Institution not found") }
        user.name = userDto.name
        user.avatarId = userDto.avatarId
        user.institution = institution
        // set profile fields
        userMapper.stringToGender(userDto.gender)?.let { user.gender = it }
        user.nationality = userDto.nationality
        userMapper.stringToAcademicStatus(userDto.academicStatus)?.let { user.academicStatus = it }
        // Resolve track from repository if provided
        val trackId = userDto.trackId
        if (trackId.isNotBlank()) {
            val track = trackRepository.findById(trackId).orElseThrow { Exception("Track not found") }
            user.track = track
        } else {
            user.track = null
        }
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun updateRole(id: String, role: String): UserDto {
        val user = userRepository.findById(id).orElseThrow { Exception("User not found") }
        val newRole = try { Role.valueOf(role) } catch (_: Exception) { throw IllegalArgumentException("Invalid role") }
        // Only allow ADMIN to assign ADMIN or EDITOR roles
        if ((newRole == Role.ADMIN || newRole == Role.EDITOR)) {
            throw IllegalArgumentException("Only ADMIN can assign ADMIN or EDITOR roles.")
        }
        user.role = newRole
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    @Transactional
    override fun updateStatus(id: String, status: String): UserDto {
        val user = userRepository.findById(id).orElseThrow { Exception("User not found") }
        val newStatus = try { AccountStatus.valueOf(status) } catch (_: Exception) { throw IllegalArgumentException("Invalid status") }
        user.status = newStatus
        val savedUser = userRepository.save(user)
        return userMapper.toDto(savedUser)
    }

    override fun delete(id: String) {
        userRepository.deleteById(id)
    }
}