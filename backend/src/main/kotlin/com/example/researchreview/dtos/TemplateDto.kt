package com.example.researchreview.dtos

data class TemplateDto(
    var id: String,
    var name: String,
    var description: String?,
    var bucketPath: String,
    var createdAt: String,
    var createdBy: String,
    var updatedAt: String,
    var updatedBy: String,
    var variables: List<String>? = null // List of variable names required for this template
) {
    constructor(): this("", "", "", "", "", "", "", "")
}