package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.services.TrackService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/tracks")
class TrackController(
    private val trackService: TrackService
) {

    @GetMapping
    fun getAllTracks(): ResponseEntity<BaseResponseDto<List<TrackDto>>> {
        val tracks = trackService.getAll()
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "Tracks retrieved successfully",
                data = tracks
            )
        )
    }

    @GetMapping("/{id}")
    fun getTrackById(@PathVariable id: String): ResponseEntity<BaseResponseDto<String>> {
        val trackName = trackService.getById(id)
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 200,
                message = "Track found",
                data = trackName
            )
        )
    }
}
