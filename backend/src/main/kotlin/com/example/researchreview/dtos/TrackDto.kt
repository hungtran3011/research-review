package com.example.researchreview.dtos

import java.time.LocalDateTime

data class TrackDto(
    var id: String,
    var name: String,
    var editors: List<EditorDto>,
    var description: String?,
    var isActive: Boolean,
    var createdAt: LocalDateTime? = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = LocalDateTime.now(),
    var createdBy: String?,
    var updatedBy: String?
) {
    constructor(): this(
        "",
        "",
        emptyList(),
        "",
        true,
        LocalDateTime.now(),
        LocalDateTime.now(),
        "",
        ""
    )

    constructor(
        id: String,
        name: String,
        editors: List<EditorDto>,
        description: String?,
        isActive: Boolean,
    ) : this(
        id,
        name,
        editors,
        description,
        isActive,
        LocalDateTime.now(),
        LocalDateTime.now(),
        "",
        ""
    )
}