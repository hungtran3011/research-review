package com.example.researchreview.repositories

import com.example.researchreview.entities.Track
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TrackRepository: JpaRepository<Track, String> {
}