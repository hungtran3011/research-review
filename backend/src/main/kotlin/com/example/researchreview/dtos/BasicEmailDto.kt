package com.example.researchreview.dtos

data class BasicEmailDto(
    var to: List<String>,
    var cc: List<String>? = null,
    var bcc: List<String>? = null,
    var subject: String,
    var message: String,
    var template: String,
    var attachment: Map<String, ByteArray>? = null
)