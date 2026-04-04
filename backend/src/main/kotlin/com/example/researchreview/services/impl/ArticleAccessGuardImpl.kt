package com.example.researchreview.services.impl

import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ArticleAuthor
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.entities.User
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.EditorRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.services.ArticleAccessGuard
import com.example.researchreview.services.CurrentUserService
import jakarta.persistence.EntityNotFoundException
import jakarta.persistence.criteria.Predicate
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service

@Service
class ArticleAccessGuardImpl(
    private val articleRepository: ArticleRepository,
    private val editorRepository: EditorRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val currentUserService: CurrentUserService
) : ArticleAccessGuard {

    override fun listAccessibleArticles(pageable: Pageable): Page<Article> {
        return listAccessibleArticles(pageable, null, null, null)
    }

    override fun listAccessibleArticles(
        pageable: Pageable,
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Page<Article> {
        val user = currentUserService.currentUser()
        val spec = buildAccessibleSpecification(user)
            .and(buildFilterSpecification(title, author, status))
        return articleRepository.findAll(spec, pageable)
    }

    override fun countAccessibleArticles(
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Long {
        val user = currentUserService.currentUser()
        val spec = buildAccessibleSpecification(user)
            .and(buildFilterSpecification(title, author, status))
        return articleRepository.count(spec)
    }

    override fun fetchAccessibleArticle(articleId: String): Article {
        val user = currentUserService.currentUser()
        val article = when {
            user == null || user.hasRole(Role.ADMIN) || user.hasRole(Role.CHAIR) -> {
                articleRepository.findByIdAndDeletedFalse(articleId).orElse(null)
            }
            user.hasRole(Role.EDITOR) -> {
                val trackIds = resolveEditorTrackIds(user.id)
                if (trackIds.isEmpty()) null
                else articleRepository.findByIdAndDeletedFalseAndTrackIdIn(articleId, trackIds).orElse(null)
            }
            else -> {
                val reviewerHit = if (user.hasRole(Role.REVIEWER)) {
                    val relation = reviewerArticleRepository
                        .findByArticleIdAndReviewerUserIdOrEmail(articleId, user.id, user.email)
                        .orElse(null)
                    if (relation != null && relation.status == ReviewerInvitationStatus.ACCEPTED) {
                        articleRepository.findByIdAndDeletedFalse(articleId).orElse(null)
                    } else {
                        null
                    }
                } else {
                    null
                }
                reviewerHit ?: if (user.hasRole(Role.RESEARCHER)) {
                    // Check if user is author OR creator of the article
                    articleRepository.findByIdForAuthor(articleId, user.id)?.orElse(null)
                        ?: articleRepository.findByIdAndCreator(articleId, user.id).orElse(null)
                } else {
                    null
                }
            }
        }

        return article ?: throw EntityNotFoundException("article.notFoundOrAccessDenied")
    }

    private fun resolveEditorTrackIds(userId: String): List<String> {
        return editorRepository.findAllByUserIdAndDeletedFalse(userId)
            .map { it.track.id }
            .distinct()
    }

    private fun buildAccessibleSpecification(user: User?): Specification<Article> {
        return Specification { root, query, cb ->
            val predicates = mutableListOf<Predicate>()
            predicates += cb.isFalse(root.get("deleted"))

            if (user == null || user.hasRole(Role.ADMIN) || user.hasRole(Role.CHAIR)) {
                return@Specification cb.and(*predicates.toTypedArray())
            }

            if (user.hasRole(Role.EDITOR)) {
                val trackIds = resolveEditorTrackIds(user.id)
                if (trackIds.isEmpty()) return@Specification cb.disjunction()
                predicates += root.get<String>("track").get<String>("id").`in`(trackIds)
                return@Specification cb.and(*predicates.toTypedArray())
            }

            if (user.hasRole(Role.REVIEWER)) {
                val criteriaQuery = query ?: return@Specification cb.disjunction()
                val sub = criteriaQuery.subquery(String::class.java)
                val ra = sub.from(ReviewerArticle::class.java)
                val reviewer = ra.get<Reviewer>("reviewer")
                sub.select(ra.get<Article>("article").get("id"))
                    .where(
                        cb.equal(ra.get<Article>("article").get<String>("id"), root.get<String>("id")),
                        cb.isFalse(ra.get("deleted")),
                        cb.equal(ra.get<ReviewerInvitationStatus>("status"), ReviewerInvitationStatus.ACCEPTED),
                        cb.or(
                            cb.equal(reviewer.get<User>("user").get<String>("id"), user.id),
                            cb.equal(cb.lower(reviewer.get("email")), user.email.lowercase())
                        )
                    )
                predicates += cb.exists(sub)
                return@Specification cb.and(*predicates.toTypedArray())
            }

            if (user.hasRole(Role.RESEARCHER)) {
                val criteriaQuery = query ?: return@Specification cb.disjunction()
                val sub = criteriaQuery.subquery(String::class.java)
                val aa = sub.from(ArticleAuthor::class.java)
                val author = aa.get<Author>("author")
                sub.select(aa.get<Article>("article").get("id"))
                    .where(
                        cb.equal(aa.get<Article>("article").get<String>("id"), root.get<String>("id")),
                        cb.isFalse(aa.get("deleted")),
                        cb.equal(author.get<User>("user").get<String>("id"), user.id)
                    )
                predicates += cb.exists(sub)
                return@Specification cb.and(*predicates.toTypedArray())
            }

            cb.disjunction()
        }
    }

    private fun buildFilterSpecification(
        title: String?,
        author: String?,
        status: ArticleStatus?
    ): Specification<Article> {
        return Specification { root, query, cb ->
            val predicates = mutableListOf<Predicate>()

            val titleFilter = title?.trim().orEmpty()
            if (titleFilter.isNotEmpty()) {
                predicates += cb.like(cb.lower(root.get("title")), "%${titleFilter.lowercase()}%")
            }

            val authorFilter = author?.trim().orEmpty()
            if (authorFilter.isNotEmpty()) {
                val criteriaQuery = query ?: return@Specification cb.disjunction()
                val sub = criteriaQuery.subquery(String::class.java)
                val aa = sub.from(ArticleAuthor::class.java)
                val authorEntity = aa.get<Author>("author")
                sub.select(aa.get<Article>("article").get("id"))
                    .where(
                        cb.equal(aa.get<Article>("article").get<String>("id"), root.get<String>("id")),
                        cb.isFalse(aa.get("deleted")),
                        cb.like(cb.lower(authorEntity.get("name")), "%${authorFilter.lowercase()}%")
                    )
                predicates += cb.exists(sub)
            }

            if (status != null) {
                predicates += cb.equal(root.get<ArticleStatus>("status"), status)
            }

            if (predicates.isEmpty()) cb.conjunction() else cb.and(*predicates.toTypedArray())
        }
    }
}
