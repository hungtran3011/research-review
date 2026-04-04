package com.example.researchreview.dtos

data class ArticleDashboardStatsDto(
    val total: Long,
    val pending: Long,
    val accepted: Long,
    val rejected: Long,
)
