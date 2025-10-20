package com.example.researchreview

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import kotlin.test.Test

@SpringBootTest
@AutoConfigureMockMvc
class HealthyTest {
    @Autowired
    lateinit var mvc: MockMvc

    @Test
    fun testHealthy() {
        val request = mvc.perform(
            MockMvcRequestBuilders.get("/api/v1/test")
        )
        request.andExpect(
            MockMvcResultMatchers.status().isOk
        )
        request.andExpect(
            MockMvcResultMatchers.content()
                .string("Hello World! Test complete")
        )
    }
}