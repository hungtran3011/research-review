package com.example.researchreview.configs

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") private val jwkSetUri: String,
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") private val issuerUri: String,
    private val corsConfigurer: CorsConfigurationSource,
    private val jwtDecoder: JwtDecoder
) {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/api/v1/test/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/api/v1/auth/**",
                    "/api/v1/users/complete-info",
                    "/api/v1/institutions/**",
                    "/api/v1/tracks/**"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .oauth2ResourceServer {
                it.jwt { jwtConfigurer ->
                    jwtConfigurer.decoder(jwtDecoder)
                }
            }
            .cors { cors -> cors.configurationSource(corsConfigurer) }
        return http.build()
    }

}