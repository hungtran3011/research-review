package com.example.researchreview.controllers

import com.example.researchreview.services.EditorService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.test.context.ContextConfiguration
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import org.mockito.kotlin.any

@WebMvcTest(
    controllers = [EditorController::class],
    excludeAutoConfiguration = [
        SecurityAutoConfiguration::class,
        SecurityFilterAutoConfiguration::class,
        OAuth2ResourceServerAutoConfiguration::class
    ]
)
@ContextConfiguration(classes = [EditorController::class, EditorControllerTest.TestConfig::class])
class EditorControllerTest {
    @Autowired
    lateinit var mvc: MockMvc

    @Autowired
    lateinit var editorService: EditorService

    @Configuration
    class TestConfig {
        @Bean
        fun editorService(): EditorService = Mockito.mock(EditorService::class.java)
    }

    @BeforeEach
    fun setup() {
        // Setup mock to return an empty page
        val pageable = PageRequest.of(0, 10)
        val emptyPage = PageImpl<com.example.researchreview.dtos.EditorDto>(emptyList(), pageable, 0)

        Mockito.`when`(editorService.getAll(any<Pageable>()))
            .thenReturn(emptyPage)
    }

    @Test
    fun getAllTest() {
        val req = mvc.perform(
            MockMvcRequestBuilders.get("/api/v1/editors/?page=0&size=10")
        )
        req.andExpect(MockMvcResultMatchers.status().isOk)
        println(req.andReturn().response.contentAsString)
    }
}
