package com.example.researchreview.repositories

import com.example.researchreview.entities.Article
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface ArticleRepository: JpaRepository<Article, String> {
	fun findAllByDeletedFalse(pageable: Pageable): Page<Article>
	fun findByIdAndDeletedFalse(id: String): Optional<Article>
}