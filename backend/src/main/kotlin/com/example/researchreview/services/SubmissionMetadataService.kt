package com.example.researchreview.services

import com.example.researchreview.dtos.SubmissionMetadataDto

interface SubmissionMetadataService {
    fun getSubmissionMetadata(): SubmissionMetadataDto
}
