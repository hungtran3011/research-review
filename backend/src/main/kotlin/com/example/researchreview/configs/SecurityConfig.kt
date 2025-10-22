package com.example.researchreview.configs

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        // Security filter chain configuration goes here
        http
            .csrf { it.ignoringRequestMatchers("/api/v1/test/**", "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html") }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/api/v1/test/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html"
                ).permitAll()
                it.anyRequest().authenticated()
            }
        return http.build()
    }
}