package com.example.researchreview.dtos

data class SubmissionTrackOptionDto(
    val id: String,
    val name: String,
    val topics: List<SubmissionTopicOptionDto>,
)
