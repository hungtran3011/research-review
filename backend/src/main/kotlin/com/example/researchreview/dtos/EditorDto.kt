package com.example.researchreview.dtos

import co.elastic.clients.elasticsearch.ingest.Local
import java.time.LocalDateTime

data class EditorDto(
    var id: String,
    var name: String,
    var email: String,
    var institution: InstitutionDto,
    var user: UserDto?,
    var createdAt: LocalDateTime,
    var createdBy: LocalDateTime,
    var updatedAt: String,
    var updatedBy: String
)