package com.example.researchreview.configs

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "custom")
class CustomProperties {
    lateinit var frontEndUrl: String
    lateinit var jwtSecret: String
    lateinit var accessExpiration: String
    lateinit var refreshExpiration: String
    lateinit var redisKeySecret: String
    lateinit var jwtPublicPemKey: String
    lateinit var jwtPrivatePemKey: String
}