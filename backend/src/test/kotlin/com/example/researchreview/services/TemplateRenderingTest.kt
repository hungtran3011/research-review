package com.example.researchreview.services

import io.awspring.cloud.s3.S3Template
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context

@SpringBootTest
class TemplateRenderingTest {

    @Autowired
    private lateinit var stringTemplateEngine: TemplateEngine

    @MockitoBean
    private lateinit var redisTemplate: RedisTemplate<String, String>

    @MockitoBean
    private lateinit var s3Template: S3Template

    @Test
    fun templateRenderingWithVariables() {
        // This is the HTML template with Thymeleaf variables
        val templateHtml = """
            <html>
                <body>
                    <h1>Welcome, <span th:text="${'$'}{userName}">User</span>!</h1>
                    <p>Thank you for joining <span th:text="${'$'}{platformName}">Platform</span>.</p>
                    <p>Your email is: <span th:text="${'$'}{userEmail}">email@example.com</span></p>
                    <div th:if="${'$'}{showLink}">
                        <a th:href="${'$'}{resetLink}" href="#">Click here to reset password</a>
                    </div>
                </body>
            </html>
        """.trimIndent()

        // Create context with variables
        val context = Context()
        context.setVariable("userName", "John Doe")
        context.setVariable("platformName", "Research Review Platform")
        context.setVariable("userEmail", "john.doe@example.com")
        context.setVariable("showLink", true)
        context.setVariable("resetLink", "https://example.com/reset?token=abc123")

        // Process template - this is where the magic happens!
        val renderedHtml = stringTemplateEngine.process(templateHtml, context)

        // Print result to see the transformation
        println("=== ORIGINAL TEMPLATE ===")
        println(templateHtml)
        println("\n=== RENDERED OUTPUT ===")
        println(renderedHtml)

        // The rendered HTML will have all ${variables} replaced with actual values
        assert(renderedHtml.contains("John Doe"))
        assert(renderedHtml.contains("Research Review Platform"))
        assert(renderedHtml.contains("john.doe@example.com"))
        assert(renderedHtml.contains("https://example.com/reset?token=abc123"))
    }

    @Test
    fun conditionalRendering() {
        val templateHtml = """
            <div th:if="${'$'}{isApproved}">
                <p>Your article has been approved!</p>
            </div>
            <div th:unless="${'$'}{isApproved}">
                <p>Your article is pending review.</p>
            </div>
        """.trimIndent()

        // Test with isApproved = true
        val context1 = Context()
        context1.setVariable("isApproved", true)
        val rendered1 = stringTemplateEngine.process(templateHtml, context1)

        println("=== When isApproved = true ===")
        println(rendered1)
        assert(rendered1.contains("approved"))
        assert(!rendered1.contains("pending review"))

        // Test with isApproved = false
        val context2 = Context()
        context2.setVariable("isApproved", false)
        val rendered2 = stringTemplateEngine.process(templateHtml, context2)

        println("\n=== When isApproved = false ===")
        println(rendered2)
        assert(!rendered2.contains("approved"))
        assert(rendered2.contains("pending review"))
    }

    @Test
    fun listIteration() {
        val templateHtml = """
            <h3>Reviewers:</h3>
            <ul>
                <li th:each="reviewer : ${'$'}{reviewers}" th:text="${'$'}{reviewer}">Reviewer Name</li>
            </ul>
        """.trimIndent()

        val context = Context()
        context.setVariable("reviewers", listOf("Dr. Smith", "Dr. Johnson", "Dr. Williams"))

        val rendered = stringTemplateEngine.process(templateHtml, context)

        println("=== List Iteration Result ===")
        println(rendered)
        assert(rendered.contains("Dr. Smith"))
        assert(rendered.contains("Dr. Johnson"))
        assert(rendered.contains("Dr. Williams"))
    }
}

