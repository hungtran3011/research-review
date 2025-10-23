package com.example.researchreview.configs

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.thymeleaf.TemplateEngine
import org.thymeleaf.templatemode.TemplateMode
import org.thymeleaf.templateresolver.StringTemplateResolver

@Configuration
class ThymeleafConfig {

    @Bean
    fun stringTemplateEngine(): TemplateEngine {
        val templateEngine = TemplateEngine()
        val templateResolver = StringTemplateResolver()

        // Configure to treat input as actual template content, not template name
        templateResolver.templateMode = TemplateMode.HTML
        templateResolver.isCacheable = false
        templateResolver.order = 1

        templateEngine.setTemplateResolver(templateResolver)
        return templateEngine
    }
}
