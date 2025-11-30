package com.example.researchreview.controllers

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.services.EditorService
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers

@WebMvcTest(
    controllers = [EditorController::class],
    excludeAutoConfiguration = [
        SecurityAutoConfiguration::class,
        SecurityFilterAutoConfiguration::class,
        OAuth2ResourceServerAutoConfiguration::class
    ]
)
class EditorControllerTest {
    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var editorService: EditorService

    @Test
    fun getAllEditorsReturns200() {
        val pageable = PageRequest.of(0, 10)
        val emptyPage = PageImpl(listOf<EditorDto>(), pageable, 0)
        whenever(editorService.getAll(any())).thenReturn(emptyPage)

        val req = mvc.perform(
            MockMvcRequestBuilders.get("/api/v1/editors/?page=0&size=10")
        )
        req.andExpect(MockMvcResultMatchers.status().isOk)
        println(req.andReturn().response.contentAsString)
    }
}
