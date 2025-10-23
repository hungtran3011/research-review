package com.example.researchreview.dtos


data class TemplateRequestDto (
    var name: String,
    var description: String?,
    var htmlContent: String,
    var variables: List<String>? = null // List of variable names like ["userName", "userEmail", "resetLink"]
)