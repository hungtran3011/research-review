package com.example.researchreview.mappers

import com.example.researchreview.dtos.ArticleDto
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.Track
import org.springframework.stereotype.Component

@Component
class ArticleMapper(
    private val authorMapper: AuthorMapper,
    private val reviewerMapper: ReviewerMapper
) {
    fun toDto(article: Article, authors: List<Author>, reviewers: List<Reviewer>): ArticleDto {
        return ArticleDto(
            id = article.id,
            title = article.title,
            abstract = article.abstract,
            conclusion = article.conclusion,
            link = article.link,
            track = trackToDto(article.track),
            status = article.status,
            initialReviewNote = article.initialReviewNote,
            initialReviewNextSteps = article.initialReviewNextSteps,
            authors = authors.map { authorMapper.toDto(it) },
            reviewers = reviewers.map { reviewerMapper.toDto(it) },
            createdAt = article.createdAt,
            updatedAt = article.updatedAt,
            createdBy = article.createdBy,
            updatedBy = article.updatedBy
        )
    }

    private fun trackToDto(track: Track): TrackDto {
        return TrackDto(
            id = track.id,
            name = track.name,
            editors = emptyList(),
            description = track.description,
            isActive = track.isActive,
            createdAt = track.createdAt,
            updatedAt = track.updatedAt,
            createdBy = track.createdBy,
            updatedBy = track.updatedBy
        )
    }
}
