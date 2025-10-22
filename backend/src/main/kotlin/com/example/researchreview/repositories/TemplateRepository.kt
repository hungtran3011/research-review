package com.example.researchreview.repositories

import com.example.researchreview.entities.Template
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TemplateRepository : JpaRepository<Template, String>
