package com.example.researchreview.configs

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.connection.RedisStandaloneConfiguration
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.StringRedisSerializer

@Configuration
class RedisConfig {
    @Value("\${spring.data.redis.host}")
    lateinit var host: String

    @Value("\${spring.data.redis.port}")
    var port: Int = 6379

    @Value("\${spring.data.redis.password:}")
    var password: String = ""

    @Value("\${spring.data.redis.ssl.enabled:false}")
    var sslEnabled: Boolean = false

    @Bean
    fun redisConnectionFactory(): RedisConnectionFactory {
        val redisConfig = RedisStandaloneConfiguration(host, port)
        if (password.isNotBlank()) {
            redisConfig.setPassword(password)
        }
        val clientConfig = io.lettuce.core.ClientOptions.builder()
            .build()
        val lettuceClientConfig = org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration.builder()
        if (sslEnabled) {
            lettuceClientConfig.useSsl().disablePeerVerification()
        }
        return LettuceConnectionFactory(redisConfig, lettuceClientConfig.build())
    }

    @Bean
    fun redisTemplate(connectionFactory: RedisConnectionFactory): RedisTemplate<String, Any> {
        val template = RedisTemplate<String, Any>()
        template.connectionFactory = connectionFactory

        // Use String serializer for keys
        template.keySerializer = StringRedisSerializer()
        template.hashKeySerializer = StringRedisSerializer()

        // Use JSON serializer for values
        template.valueSerializer = GenericJackson2JsonRedisSerializer()
        template.hashValueSerializer = GenericJackson2JsonRedisSerializer()

        template.afterPropertiesSet()
        return template
    }
}