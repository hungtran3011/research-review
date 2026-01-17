package com.example.researchreview.services.impl

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.dtos.EditorRequestDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.entities.Editor
import com.example.researchreview.entities.Track
import com.example.researchreview.entities.User
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.EditorService
import jakarta.persistence.EntityNotFoundException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class EditorServiceImpl(
    private val editorRepository: EditorRepository,
    private val trackRepository: TrackRepository,
    private val userRepository: UserRepository
): EditorService {

    @Transactional(readOnly = true)
    override fun getAll(pageable: Pageable): Page<EditorDto> {
        val editors = editorRepository.findAllByDeletedFalse(pageable)
        return editors.map { editor -> toDto(editor) }
    }

    @Transactional(readOnly = true)
    override fun getById(id: String): EditorDto {
        val editor = editorRepository.findByIdAndDeletedFalse(id)
            .orElseThrow { EntityNotFoundException("Editor not found with id $id") }
        return toDto(editor)
    }

    @Transactional
    override fun create(request: EditorRequestDto): EditorDto {
        val editor = Editor().apply {
            track = findTrackOrThrow(request.trackId)
            user = findUserOrThrow(request.userId)
        }
        val saved = editorRepository.save(editor)
        return toDto(saved)
    }

    @Transactional
    override fun update(id: String, request: EditorRequestDto): EditorDto {
        val existing = editorRepository.findByIdAndDeletedFalse(id)
            .orElseThrow { EntityNotFoundException("Editor not found with id $id") }

        if (request.trackId.isNotBlank() && existing.track.id != request.trackId) {
            existing.track = findTrackOrThrow(request.trackId)
        }

        if (request.userId.isNotBlank() && existing.user.id != request.userId) {
            existing.user = findUserOrThrow(request.userId)
        }

        val saved = editorRepository.save(existing)
        return toDto(saved)
    }

    @Transactional
    override fun delete(id: String) {
        editorRepository.deleteById(id)
    }

    private fun findTrackOrThrow(trackId: String): Track {
        if (trackId.isBlank()) {
            throw IllegalArgumentException("trackId must not be blank")
        }
        return trackRepository.findByIdAndDeletedFalse(trackId)
            .orElseThrow { EntityNotFoundException("Track not found with id $trackId") }
    }

    private fun findUserOrThrow(userId: String): User {
        if (userId.isBlank()) {
            throw IllegalArgumentException("userId must not be blank")
        }
        return userRepository.findByIdAndDeletedFalse(userId)
            .orElseThrow { EntityNotFoundException("User not found with id $userId") }
    }

    private fun toDto(editor: Editor): EditorDto {
        return EditorDto(
            id = editor.id,
            track = TrackDto(
                id = editor.track.id,
                name = editor.track.name,
                editors = emptyList(),
                description = null,
                isActive = true,
                createdBy = null,
                updatedBy = null
            ),
            user = userToDto(editor.user),
            createdAt = editor.createdAt,
            createdBy = editor.createdBy,
            updatedAt = editor.updatedAt,
            updatedBy = editor.updatedBy
        )
    }

    private fun userToDto(user: User): UserDto {
        return UserDto(
            id = user.id,
            name = user.name,
            role = user.role.name,
            roles = user.effectiveRoles.map { it.name },
            email = user.email,
            institution = user.institution?.let {
                InstitutionDto(
                    id = it.id,
                    name = it.name,
                    country = it.country
                )
            },
            track = user.track?.let {
                TrackDto(
                    id = it.id,
                    name = it.name,
                    editors = emptyList(),
                    description = null,
                    isActive = true,
                    createdBy = null,
                    updatedBy = null
                )
            },
            gender = user.gender,
            nationality = user.nationality,
            academicStatus = user.academicStatus,
            status = user.status.name
        )
    }
}