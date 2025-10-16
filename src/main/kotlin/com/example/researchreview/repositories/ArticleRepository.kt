package com.example.researchreview.repositories

import com.example.researchreview.entities.Article
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ArticleRepository: JpaRepository<Article, String> {
}