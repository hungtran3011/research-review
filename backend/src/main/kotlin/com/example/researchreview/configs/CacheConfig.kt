package com.example.researchreview.configs

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.cache.RedisCacheManager
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import java.time.Duration

object CacheNames {
    const val TRACKS_ALL = "tracks:all"
    const val TRACK_BY_ID = "tracks:byId"

    const val INSTITUTION_BY_ID = "institutions:byId"

    const val TEMPLATE_BY_ID = "templates:byId"
    const val TEMPLATE_CONTENT = "templates:content"
}

@EnableCaching
@Configuration
class CacheConfig {

    @Bean
    fun cacheManager(
        connectionFactory: RedisConnectionFactory,
        objectMapper: ObjectMapper
    ): CacheManager {
        val serializer = GenericJackson2JsonRedisSerializer(objectMapper)
        val valuePair = RedisSerializationContext.SerializationPair.fromSerializer(serializer)

        val baseConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeValuesWith(valuePair)
            .disableCachingNullValues()
            .entryTtl(Duration.ofMinutes(10))

        val cacheConfigs = mapOf(
            CacheNames.TRACKS_ALL to baseConfig.entryTtl(Duration.ofMinutes(10)),
            CacheNames.TRACK_BY_ID to baseConfig.entryTtl(Duration.ofMinutes(30)),
            CacheNames.INSTITUTION_BY_ID to baseConfig.entryTtl(Duration.ofHours(1)),
            CacheNames.TEMPLATE_BY_ID to baseConfig.entryTtl(Duration.ofMinutes(30)),
            CacheNames.TEMPLATE_CONTENT to baseConfig.entryTtl(Duration.ofMinutes(10)),
        )

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(baseConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .build()
    }
}
