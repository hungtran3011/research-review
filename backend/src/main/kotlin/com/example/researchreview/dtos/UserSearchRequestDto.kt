package com.example.researchreview.dtos

data class UserSearchRequestDto(
    var name: String? = null,
    var email: String? = null,
    var institutionName: String? = null,
    var role: String? = null,
    var roleOrdinal: Int? = null,
    var status: String? = null,
    var statusOrdinal: Int? = null
)
