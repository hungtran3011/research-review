package com.example.researchreview.configs

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "feature")
class FeatureFlagsProperties {
    var conferenceModelEnabled: Boolean = false
    var structuredReviewEnabled: Boolean = false
    var reviewThresholdGateEnabled: Boolean = false
    var demoSeedEnabled: Boolean = false
}
