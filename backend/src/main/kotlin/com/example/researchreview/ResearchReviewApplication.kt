package com.example.researchreview

import com.example.researchreview.configs.CustomProperties
import com.example.researchreview.configs.FeatureFlagsProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableConfigurationProperties(CustomProperties::class, FeatureFlagsProperties::class)
class ResearchReviewApplication

fun main(args: Array<String>) {
    runApplication<ResearchReviewApplication>(*args)
}
