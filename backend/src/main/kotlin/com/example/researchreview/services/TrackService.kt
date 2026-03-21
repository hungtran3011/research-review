package com.example.researchreview.services

import com.example.researchreview.dtos.TrackDto

interface TrackService {
    fun getAll() : List<TrackDto>
    fun getById(id: String) : String
}