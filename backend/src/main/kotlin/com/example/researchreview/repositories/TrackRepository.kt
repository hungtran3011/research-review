package com.example.researchreview.repositories

import com.example.researchreview.entities.Track
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface TrackRepository: JpaRepository<Track, String> {
    @Query("SELECT t FROM Track t WHERE t.deleted = false")
    override fun findAll(): List<Track>

    fun findByIdAndDeletedFalse(id: String): Optional<Track>
}