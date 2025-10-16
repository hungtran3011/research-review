package com.example.researchreview.repositories

import com.example.researchreview.entities.Institution
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface InstitutionRepository: JpaRepository<Institution, String> {
}