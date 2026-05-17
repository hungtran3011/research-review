package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.services.TrackService
import com.example.researchreview.constants.ErrorCode
import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/tracks")
class TrackController(
    private val trackService: TrackService
) {

    @GetMapping
    fun getAllTracks(): ResponseEntity<BaseResponseDto<List<TrackDto>>> {
        try {
            val tracks = trackService.getAll()
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Tracks retrieved successfully",
                    data = tracks
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                )
            )
        }
    }

    @GetMapping("/{id}")
    fun getTrackById(@PathVariable id: String): ResponseEntity<BaseResponseDto<String>> {
        try {
            val trackName = trackService.getById(id)
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Track found",
                    data = trackName
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                )
            )
        }
    }
}
