package com.example.researchreview.services

import com.example.researchreview.dtos.ConferenceRegistrationResultDto

interface ConferenceRegistrationService {
    fun register(conferenceId: String): ConferenceRegistrationResultDto
}
