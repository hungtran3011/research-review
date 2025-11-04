package com.example.researchreview.dtos

import java.time.LocalDateTime

data class EditorDto(
    var id: String = "",
    var track: TrackDto = TrackDto(),
    var user: UserDto? = null,
    var createdAt: LocalDateTime = LocalDateTime.now(),
    var createdBy: String = "",
    var updatedAt: LocalDateTime = LocalDateTime.now(),
    var updatedBy: String = ""
)