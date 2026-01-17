package com.example.researchreview.configs

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.constants.SpecialErrorCode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.http.HttpMethod

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") private val jwkSetUri: String,
    @param:Value("\${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") private val issuerUri: String,
    private val corsConfigurer: CorsConfigurationSource,
    private val jwtDecoder: JwtDecoder
) {

    private val objectMapper = jacksonObjectMapper()

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .exceptionHandling {
                it.authenticationEntryPoint { _request, response, _authException ->
                    writeJson(response, 401, "Unauthorized")
                }
                it.accessDeniedHandler { _request, response, _accessDeniedException ->
                    writeJson(response, 403, "Access denied")
                }
            }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/api/v1/auth/**",
                    "/api/v1/users/complete-info",
                    "/api/v1/reviewer-invites/resolve"
                ).permitAll()

                it.requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/institutions/**",
                    "/api/v1/tracks/**"
                ).permitAll()
                it.anyRequest().authenticated()
            }
            .oauth2ResourceServer {
                it.jwt { jwtConfigurer ->
                    jwtConfigurer
                        .decoder(jwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                }
            }
            .cors { cors -> cors.configurationSource(corsConfigurer) }
        return http.build()
    }

    private fun writeJson(response: HttpServletResponse, code: Int, message: String) {
        response.status = 200
        response.contentType = "application/json"
        val body = when (code) {
            401, 403 -> BaseResponseDto(code = code, message = message, data = null)
            else -> BaseResponseDto(code = SpecialErrorCode.GENERAL_ERROR.value, message = message, data = null)
        }
        response.writer.use { it.write(objectMapper.writeValueAsString(body)) }
    }

    @Bean
    fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
        val grantedAuthoritiesConverter = JwtGrantedAuthoritiesConverter().apply {
            setAuthorityPrefix("ROLE_")
            setAuthoritiesClaimName("roles")
        }
        return JwtAuthenticationConverter().apply {
            setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter)
        }
    }

}