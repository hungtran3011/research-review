package com.example.researchreview.configs

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class CorsConfig {
    @Value("\${custom.front-end-url}")
    private lateinit var primaryFrontEndUrl: String

    @Value("\${custom.extra-front-end-urls:}")
    private val extraFrontEndUrls: String? = null

    @Bean
    fun corsConfigurer(): CorsConfigurationSource {
        val normalizedPrimary = primaryFrontEndUrl.trim().trimEnd('/')
        require(normalizedPrimary.isNotBlank()) { "Property 'custom.front-end-url' must be set for CORS configuration" }

        val additionalOrigins = extraFrontEndUrls
            ?.split(',')
            ?.map { it.trim().trimEnd('/') }
            ?.filter { it.isNotEmpty() }
            ?: emptyList()

        val patterns = buildSet {
            add(normalizedPrimary)
            if (normalizedPrimary.startsWith("http://")) {
                add(normalizedPrimary.replaceFirst("http://", "https://"))
            }
            addAll(additionalOrigins)
            add("http://localhost:*")
            add("https://localhost:*")
            add("http://127.0.0.1:*")
            add("https://127.0.0.1:*")
            add("http://0.0.0.0:*")
        }

        val config = CorsConfiguration().apply {
            allowedOriginPatterns = patterns.toList()
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            allowedHeaders = listOf("*")
            exposedHeaders = listOf("Content-Disposition")
            allowCredentials = true
            maxAge = 3600
        }
        val source = org.springframework.web.cors.UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}