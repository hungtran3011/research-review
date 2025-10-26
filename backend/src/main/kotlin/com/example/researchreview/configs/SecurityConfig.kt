package com.example.researchreview.configs

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtDecoders
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class SecurityConfig(
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") private val jwkSetUri: String,
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") private val issuerUri: String
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
                    "/api/v1/auth/**"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .oauth2ResourceServer {
                it.jwt { jwtConfigurer ->
                    jwtConfigurer.decoder(jwtDecoder())
                }
            }
        return http.build()
    }

    @Bean
    fun jwtDecoder(): JwtDecoder {
        if (jwkSetUri.isNotBlank()) {
            return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build()
        }
        if (issuerUri.isNotBlank()) {
            return JwtDecoders.fromOidcIssuerLocation(issuerUri)
        }
        throw IllegalStateException("Either 'spring.security.oauth2.resourceserver.jwt.jwk-set-uri' or 'spring.security.oauth2.resourceserver.jwt.issuer-uri' must be set")
    }
}