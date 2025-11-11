package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

data class TrackRequestDto(
    @field:NotBlank(message = "Name is required")
    val name: String,
    
    val description: String? = null,
    
    val isActive: Boolean = true
)
