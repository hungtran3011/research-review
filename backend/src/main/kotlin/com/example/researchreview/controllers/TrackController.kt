package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.TrackRequestDto
import com.example.researchreview.services.TrackService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/tracks")
class TrackController(
    private val trackService: TrackService
) {

    @GetMapping
    fun getAllTracks(): ResponseEntity<BaseResponseDto<List<TrackDto>>> {
        return try {
            val tracks = trackService.getAll()
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Tracks retrieved successfully",
                    data = tracks
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @GetMapping("/{id}")
    fun getTrackById(@PathVariable id: String): ResponseEntity<BaseResponseDto<String>> {
        return try {
            val trackName = trackService.getById(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Track found",
                    data = trackName
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 404,
                    message = e.message ?: "Track not found",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createTrack(@Valid @RequestBody request: TrackRequestDto): ResponseEntity<BaseResponseDto<TrackDto>> {
        return try {
            val track = trackService.create(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Track created successfully",
                    data = track
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateTrack(
        @PathVariable id: String,
        @Valid @RequestBody request: TrackRequestDto
    ): ResponseEntity<BaseResponseDto<TrackDto>> {
        return try {
            val track = trackService.update(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Track updated successfully",
                    data = track
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteTrack(@PathVariable id: String): ResponseEntity<BaseResponseDto<String>> {
        return try {
            val message = trackService.delete(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = message,
                    data = "Deleted"
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 404,
                    message = e.message ?: "Track not found",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }
}
