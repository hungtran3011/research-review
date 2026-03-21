package com.example.researchreview.repositories

import com.example.researchreview.entities.Conference
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface ConferenceRepository : JpaRepository<Conference, String> {
    fun findAllByDeletedFalse(): List<Conference>
    fun findByIdAndDeletedFalse(id: String): Optional<Conference>
    fun existsByShortNameIgnoreCaseAndDeletedFalse(shortName: String): Boolean
    fun existsByShortNameIgnoreCaseAndDeletedFalseAndIdNot(shortName: String, id: String): Boolean
}
