package com.example.researchreview.dtos

import java.time.LocalDateTime

data class SubmissionConferenceOptionDto(
    val id: String,
    val name: String,
    val shortName: String,
    val submissionDeadline: LocalDateTime?,
    val tracks: List<SubmissionTrackOptionDto>,
)
