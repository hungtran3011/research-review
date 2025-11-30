package com.example.researchreview.utils

import org.springframework.security.core.context.SecurityContextHolder

object SecurityUtils {
    fun currentUserId(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        val name = authentication?.name
        val principal = authentication?.principal
        val principalName = when (principal) {
            is String -> principal
            null -> null
            else -> principal.toString()
        }
        return when {
            !name.isNullOrBlank() -> name
            !principalName.isNullOrBlank() -> principalName!!
            else -> "system"
        }
    }
}
