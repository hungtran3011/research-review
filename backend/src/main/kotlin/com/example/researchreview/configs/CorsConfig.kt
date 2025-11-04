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
    lateinit var frontEndUrl: String

    @Bean
    fun corsConfigurer(): CorsConfigurationSource {
        frontEndUrl.trimEnd('/')
        require(frontEndUrl.isNotBlank()) { "Property 'custom.front-end-url' must be set for CORS configuration" }
        val config = CorsConfiguration()
        config.allowedOrigins = listOf(frontEndUrl,  "http://localhost:8080")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = true
        val source = org.springframework.web.cors.UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}