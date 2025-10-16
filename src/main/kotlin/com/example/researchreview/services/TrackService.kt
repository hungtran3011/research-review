package com.example.researchreview.services

import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.TrackRequestDto

interface TrackService {
    fun getAll() : List<TrackDto>
    fun getById(id: String) : String
    fun create(track: TrackRequestDto) : TrackDto
    fun update(id: String, track: TrackRequestDto) : TrackDto
    fun delete(id: String) : String
}