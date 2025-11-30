package com.example.researchreview.controllers

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.InitialReviewDecision
import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.ArticleRequestDto
import com.example.researchreview.dtos.AuthorDto
import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.dtos.InitialReviewRequestDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.dtos.ReviewerContactRequestDto
import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.services.ArticlesService
import com.example.researchreview.services.ReviewerService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.mockito.kotlin.any
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import kotlin.collections.emptyList

@WebMvcTest(
    controllers = [ArticleController::class],
    excludeAutoConfiguration = [
        SecurityAutoConfiguration::class,
        SecurityFilterAutoConfiguration::class,
        OAuth2ResourceServerAutoConfiguration::class
    ]
)
class ArticleControllerMvcTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockitoBean
    lateinit var articlesService: ArticlesService

    @MockitoBean
    lateinit var reviewerService: ReviewerService

    @Test
    fun submitArticleReturns201() {
        val request = ArticleRequestDto(
            title = "Sample",
            abstract = "Abstract",
            conclusion = "Conclusion",
            link = "https://example.com",
            trackId = "track-1",
            trackName = "AI",
            authors = listOf(
                AuthorDto(
                    name = "Alice",
                    email = "alice@example.com",
                    institution = InstitutionDto(id = "inst-1", name = "Inst", country = "US")
                )
            )
        )
        val dto = ArticleDto(
            id = "article-1",
            title = request.title,
            abstract = request.abstract,
            conclusion = request.conclusion,
            link = request.link,
            track = TrackDto(id = "track-1", name = "AI", editors = emptyList(), description = "", isActive = true),
            status = ArticleStatus.SUBMITTED
        )
        given(articlesService.create(any())).willReturn(dto)

        mockMvc.perform(
            MockMvcRequestBuilders.post("/api/v1/articles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        ).andExpect(MockMvcResultMatchers.status().isCreated)
    }

    @Test
    fun initialReviewReturns200() {
        val request = InitialReviewRequestDto(
            decision = InitialReviewDecision.SEND_TO_REVIEW,
            note = "Looks good",
            nextSteps = "Send to reviewers"
        )
        val article = ArticleDto(
            id = "article-1",
            title = "Paper",
            abstract = "Abstract",
            conclusion = "Conclusion",
            link = "https://example.com",
            track = TrackDto(id = "track-1", name = "AI", editors = emptyList<EditorDto>(), description = "", isActive = true),
            status = ArticleStatus.PENDING_REVIEW
        )
        given(articlesService.initialReview(any(), any())).willReturn(article)

        mockMvc.perform(
            MockMvcRequestBuilders.post("/api/v1/articles/article-1/initial-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        ).andExpect(MockMvcResultMatchers.status().isOk)
    }

    @Test
    fun contactReviewersReturns200() {
        val request = ReviewerContactRequestDto(
            subject = "Invitation",
            message = "Please review",
            reviewerIds = listOf("rev-1"),
            newReviewers = emptyList()
        )
        given(reviewerService.contactReviewers(any(), any())).willReturn(emptyList<ReviewerDto>())

        mockMvc.perform(
            MockMvcRequestBuilders.post("/api/v1/articles/article-1/reviewers/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        ).andExpect(MockMvcResultMatchers.status().isOk)
    }
}
