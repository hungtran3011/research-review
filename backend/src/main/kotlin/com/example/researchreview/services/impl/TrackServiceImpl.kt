package com.example.researchreview.services.impl

import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.TrackRequestDto
import com.example.researchreview.entities.Track
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.services.TrackService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TrackServiceImpl(
    private val trackRepository: TrackRepository
): TrackService {

    @Transactional
    override fun getAll(): List<TrackDto> {
        val tracks = trackRepository.findAll()
        return tracks.map { toDto(it) }
    }

    @Transactional
    override fun getById(id: String): String {
        val track = trackRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Track not found with id: $id") }
        return track.name
    }

    @Transactional
    override fun create(track: TrackRequestDto): TrackDto {
        val entity = toEntity(track)
        val savedTrack = trackRepository.save(entity)
        return toDto(savedTrack)
    }

    @Transactional
    override fun update(id: String, track: TrackRequestDto): TrackDto {
        val entity = trackRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Track not found with id: $id") }
        
        entity.name = track.name
        entity.description = track.description ?: ""
        entity.isActive = track.isActive
        
        val savedTrack = trackRepository.save(entity)
        return toDto(savedTrack)
    }

    @Transactional
    override fun delete(id: String): String {
        val track = trackRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Track not found with id: $id") }
        trackRepository.deleteById(id)
        return "Track deleted successfully"
    }

    private fun toDto(track: Track): TrackDto {
        return TrackDto(
            id = track.id.toString(),
            name = track.name,
            editors = emptyList(), // Will be populated if needed
            description = track.description,
            isActive = track.isActive,
            createdAt = track.createdAt,
            updatedAt = track.updatedAt,
            createdBy = track.createdBy,
            updatedBy = track.updatedBy
        )
    }

    private fun toEntity(dto: TrackRequestDto): Track {
        return Track().apply {
            name = dto.name
            description = dto.description ?: ""
            isActive = dto.isActive
        }
    }
}
