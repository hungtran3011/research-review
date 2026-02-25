package com.example.researchreview.repositories

import com.example.researchreview.entities.Article
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

interface ArticleRepository: JpaRepository<Article, String> {
	fun findAllByDeletedFalse(pageable: Pageable): Page<Article>
	fun findByIdAndDeletedFalse(id: String): Optional<Article>
	fun findAllByDeletedFalseAndTrackId(trackId: String, pageable: Pageable): Page<Article>
	fun findByIdAndDeletedFalseAndTrackId(id: String, trackId: String): Optional<Article>

	@Query(
		"SELECT DISTINCT a FROM Article a " +
			"JOIN ReviewerArticle ra ON ra.article = a " +
			"JOIN Reviewer r ON ra.reviewer = r " +
			"LEFT JOIN User u ON r.user = u " +
			"WHERE a.deleted = false AND ra.deleted = false " +
			"AND (u.id = :userId OR LOWER(r.email) = LOWER(:email))",
		countQuery = "SELECT COUNT(DISTINCT a.id) FROM Article a " +
			"JOIN ReviewerArticle ra ON ra.article = a " +
			"JOIN Reviewer r ON ra.reviewer = r " +
			"LEFT JOIN User u ON r.user = u " +
			"WHERE a.deleted = false AND ra.deleted = false " +
			"AND (u.id = :userId OR LOWER(r.email) = LOWER(:email))"
	)
	fun findAllByReviewerUserIdOrEmail(
		@Param("userId") userId: String,
		@Param("email") email: String,
		pageable: Pageable
	): Page<Article>

	@Query(
		"SELECT DISTINCT a FROM Article a " +
			"JOIN ArticleAuthor aa ON aa.article = a " +
			"JOIN Author auth ON aa.author = auth " +
			"JOIN User u ON auth.user = u " +
			"WHERE a.deleted = false AND aa.deleted = false AND u.id = :userId",
		countQuery = "SELECT COUNT(DISTINCT a.id) FROM Article a " +
			"JOIN ArticleAuthor aa ON aa.article = a " +
			"JOIN Author auth ON aa.author = auth " +
			"JOIN User u ON auth.user = u " +
			"WHERE a.deleted = false AND aa.deleted = false AND u.id = :userId"
	)
	fun findAllByAuthorUserId(@Param("userId") userId: String, pageable: Pageable): Page<Article>

	@Query(
		"SELECT a FROM Article a " +
			"JOIN ReviewerArticle ra ON ra.article = a " +
			"JOIN Reviewer r ON ra.reviewer = r " +
			"LEFT JOIN User u ON r.user = u " +
			"WHERE a.deleted = false AND ra.deleted = false " +
			"AND a.id = :articleId AND (u.id = :userId OR LOWER(r.email) = LOWER(:email))"
	)
	fun findByIdForReviewerOrEmail(
		@Param("articleId") articleId: String,
		@Param("userId") userId: String,
		@Param("email") email: String
	): Optional<Article>

	@Query(
		"SELECT a FROM Article a " +
			"JOIN ArticleAuthor aa ON aa.article = a " +
			"JOIN Author auth ON aa.author = auth " +
			"JOIN User u ON auth.user = u " +
			"WHERE a.deleted = false AND aa.deleted = false AND a.id = :articleId AND u.id = :userId"
	)
	fun findByIdForAuthor(
		@Param("articleId") articleId: String,
		@Param("userId") userId: String
	): Optional<Article>

	@Query(
		"SELECT a FROM Article a " +
			"WHERE a.deleted = false AND a.id = :articleId AND a.createdBy = :userId"
	)
	fun findByIdAndCreator(
		@Param("articleId") articleId: String,
		@Param("userId") userId: String
	): Optional<Article>
}