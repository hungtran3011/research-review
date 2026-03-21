package com.example.researchreview.configs

import com.example.researchreview.constants.AccountStatus
import com.example.researchreview.constants.ArticleStatus
import com.example.researchreview.constants.ConferenceMembershipRole
import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.constants.ReviewRecommendation
import com.example.researchreview.constants.ReviewerInvitationStatus
import com.example.researchreview.constants.Role
import com.example.researchreview.entities.Article
import com.example.researchreview.entities.ArticleAuthor
import com.example.researchreview.entities.ArticleTopic
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Comment
import com.example.researchreview.entities.CommentThread
import com.example.researchreview.entities.Conference
import com.example.researchreview.entities.Institution
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.ReviewerArticle
import com.example.researchreview.entities.StructuredReview
import com.example.researchreview.entities.StructuredReviewScore
import com.example.researchreview.entities.Topic
import com.example.researchreview.entities.Track
import com.example.researchreview.entities.User
import com.example.researchreview.entities.UserConferenceMembership
import com.example.researchreview.entities.UserRole
import com.example.researchreview.repositories.ArticleAuthorRepository
import com.example.researchreview.repositories.ArticleRepository
import com.example.researchreview.repositories.ArticleTopicRepository
import com.example.researchreview.repositories.AuthorRepository
import com.example.researchreview.repositories.CommentRepository
import com.example.researchreview.repositories.CommentThreadRepository
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.InstitutionRepository
import com.example.researchreview.repositories.ReviewerArticleRepository
import com.example.researchreview.repositories.ReviewerRepository
import com.example.researchreview.repositories.StructuredReviewRepository
import com.example.researchreview.repositories.StructuredReviewScoreRepository
import com.example.researchreview.repositories.TopicRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.repositories.UserConferenceMembershipRepository
import com.example.researchreview.repositories.UserRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Component
@ConditionalOnProperty(prefix = "feature", name = ["demo-seed-enabled"], havingValue = "true")
class DemoDataSeedRunner(
    private val conferenceRepository: ConferenceRepository,
    private val trackRepository: TrackRepository,
    private val topicRepository: TopicRepository,
    private val institutionRepository: InstitutionRepository,
    private val userRepository: UserRepository,
    private val membershipRepository: UserConferenceMembershipRepository,
    private val authorRepository: AuthorRepository,
    private val reviewerRepository: ReviewerRepository,
    private val articleRepository: ArticleRepository,
    private val articleAuthorRepository: ArticleAuthorRepository,
    private val articleTopicRepository: ArticleTopicRepository,
    private val reviewerArticleRepository: ReviewerArticleRepository,
    private val structuredReviewRepository: StructuredReviewRepository,
    private val structuredReviewScoreRepository: StructuredReviewScoreRepository,
    private val commentThreadRepository: CommentThreadRepository,
    private val commentRepository: CommentRepository,
) : CommandLineRunner {

    override fun run(vararg args: String?) {
        seed()
    }

    @Transactional
    fun seed() {
        val existingConference = conferenceRepository
            .findAllByDeletedFalse()
            .firstOrNull { it.shortName.equals(SEED_CONFERENCE_SHORT_NAME, ignoreCase = true) }

        if (existingConference != null) {
            return
        }

        val now = LocalDateTime.now()

        val institutionA = findOrCreateInstitution("Demo University", "https://demo.edu", "VN")
        val institutionB = findOrCreateInstitution("Applied AI Lab", "https://aai.example", "VN")

        val conference = conferenceRepository.saveAndFlush(
            Conference().apply {
                name = "AI Summit 2026"
                shortName = SEED_CONFERENCE_SHORT_NAME
                season = "Spring"
                year = 2026
                description = "Seed conference for fast local testing"
                status = ConferenceStatus.ACTIVE
                submissionDeadline = now.plusDays(30)
                minimumCompletedReviews = 3
            }
        )

        val trackNlp = Track().apply {
            name = "Natural Language Processing"
            description = "NLP track"
            isActive = true
            reviewPolicyMinCompletedReviews = 3
            this.conference = conference
        }
        val trackIr = Track().apply {
            name = "Information Retrieval"
            description = "IR track"
            isActive = true
            reviewPolicyMinCompletedReviews = 3
            this.conference = conference
        }
        trackRepository.saveAll(listOf(trackNlp, trackIr))

        val topicLlmEval = createTopic("LLM Evaluation", conference, trackNlp, 1)
        val topicPeerReview = createTopic("Peer Review Automation", conference, trackNlp, 2)
        val topicSearch = createTopic("Search Ranking", conference, trackIr, 1)

        val admin = createUser(
            name = "Demo Admin",
            email = "seed.admin@demo.local",
            primaryRole = Role.ADMIN,
            extraRoles = setOf(Role.USER),
            institution = institutionA
        )
        val chair = createUser(
            name = "Demo Chair",
            email = "seed.chair@demo.local",
            primaryRole = Role.CHAIR,
            extraRoles = setOf(Role.USER),
            institution = institutionA
        )
        val editor = createUser(
            name = "Demo Editor",
            email = "seed.editor@demo.local",
            primaryRole = Role.EDITOR,
            extraRoles = setOf(Role.USER),
            institution = institutionA
        )
        val researcher = createUser(
            name = "Demo Researcher",
            email = "seed.researcher@demo.local",
            primaryRole = Role.RESEARCHER,
            extraRoles = setOf(Role.USER),
            institution = institutionB
        )
        val reviewer1User = createUser(
            name = "Reviewer One",
            email = "seed.reviewer1@demo.local",
            primaryRole = Role.REVIEWER,
            extraRoles = setOf(Role.USER),
            institution = institutionB
        )
        val reviewer2User = createUser(
            name = "Reviewer Two",
            email = "seed.reviewer2@demo.local",
            primaryRole = Role.REVIEWER,
            extraRoles = setOf(Role.USER),
            institution = institutionB
        )
        val reviewer3User = createUser(
            name = "Reviewer Three",
            email = "seed.reviewer3@demo.local",
            primaryRole = Role.REVIEWER,
            extraRoles = setOf(Role.USER),
            institution = institutionA
        )

        createMembership(chair, conference, ConferenceMembershipRole.CHAIR)
        createMembership(editor, conference, ConferenceMembershipRole.EDITOR)
        createMembership(researcher, conference, ConferenceMembershipRole.PARTICIPANT)
        createMembership(reviewer1User, conference, ConferenceMembershipRole.PARTICIPANT)
        createMembership(reviewer2User, conference, ConferenceMembershipRole.PARTICIPANT)
        createMembership(reviewer3User, conference, ConferenceMembershipRole.PARTICIPANT)
        createMembership(admin, conference, ConferenceMembershipRole.PARTICIPANT)

        val author = findOrCreateAuthor(researcher.name, researcher.email, institutionB, researcher)
        val reviewer1 = findOrCreateReviewer(reviewer1User.name, reviewer1User.email, institutionB, reviewer1User)
        val reviewer2 = findOrCreateReviewer(reviewer2User.name, reviewer2User.email, institutionB, reviewer2User)
        val reviewer3 = findOrCreateReviewer(reviewer3User.name, reviewer3User.email, institutionA, reviewer3User)

        val article = Article().apply {
            title = "Seed Article: Conference-Centered Peer Review"
            abstract = "Seed article for testing conference/track/topic and structured review flows"
            conclusion = "This is seeded local data to speed up testing"
            link = ""
            status = ArticleStatus.IN_REVIEW
            this.conference = conference
            this.track = trackNlp
            initialReviewNote = "Scope and format checks passed"
            initialReviewNextSteps = "Proceed with assigned reviewers"
        }
        articleRepository.save(article)

        articleAuthorRepository.save(ArticleAuthor().apply {
            this.article = article
            this.author = author
            this.authorOrder = 1
        })

        articleTopicRepository.saveAll(
            listOf(
                ArticleTopic().apply {
                    this.article = article
                    this.topic = topicLlmEval
                },
                ArticleTopic().apply {
                    this.article = article
                    this.topic = topicPeerReview
                }
            )
        )

        val ra1 = createReviewerAssignment(article, reviewer1, 1)
        val ra2 = createReviewerAssignment(article, reviewer2, 2)
        val ra3 = createReviewerAssignment(article, reviewer3, 3)

        createStructuredReview(
            reviewerArticle = ra1,
            summary = "Strong technical framing with clear experiments.",
            recommendation = ReviewRecommendation.ACCEPT,
            scores = mapOf(
                "originality" to 8,
                "technical_quality" to 8,
                "clarity" to 7,
                "relevance" to 9,
                "overall" to 8,
            )
        )

        createStructuredReview(
            reviewerArticle = ra2,
            summary = "Good paper; some additional ablations requested.",
            recommendation = ReviewRecommendation.WEAK_ACCEPT,
            scores = mapOf(
                "originality" to 7,
                "technical_quality" to 7,
                "clarity" to 8,
                "relevance" to 8,
                "overall" to 7,
            )
        )

        // Leave reviewer 3 unfinished so threshold-progress testing is possible.
        commentThreadRepository.save(CommentThread().apply {
            status = com.example.researchreview.constants.CommentStatus.OPEN
            this.article = article
            this.reviewer = reviewer1
            version = 1
            pageNumber = 2
            section = "Introduction"
            selectedText = "The baseline comparison requires clarification"
            x = 120
            y = 240
            width = 300
            height = 48
        }).also { thread ->
            commentRepository.save(Comment().apply {
                content = "Please clarify how baseline A was tuned."
                this.thread = thread
                authorName = "Reviewer 1"
                authorId = reviewer1User.id
            })
            commentRepository.save(Comment().apply {
                content = "We will add a dedicated ablation in revision."
                this.thread = thread
                authorName = researcher.name
                authorId = researcher.id
            })
        }

        // Additional article to test chair-decision-ready state.
        val readyArticle = Article().apply {
            title = "Seed Article: Ready For Chair Decision"
            abstract = "Seeded article with completed structured reviews"
            conclusion = "Ready state for chair decision tests"
            link = ""
            status = ArticleStatus.REVIEWS_COMPLETED
            this.conference = conference
            this.track = trackIr
            initialReviewNote = "Passed screening"
            initialReviewNextSteps = "Chair can decide"
        }
        articleRepository.save(readyArticle)

        articleAuthorRepository.save(ArticleAuthor().apply {
            this.article = readyArticle
            this.author = author
            this.authorOrder = 1
        })

        articleTopicRepository.save(ArticleTopic().apply {
            this.article = readyArticle
            this.topic = topicSearch
        })

        val readyRa1 = createReviewerAssignment(readyArticle, reviewer1, 1)
        val readyRa2 = createReviewerAssignment(readyArticle, reviewer2, 2)
        val readyRa3 = createReviewerAssignment(readyArticle, reviewer3, 3)

        createStructuredReview(
            reviewerArticle = readyRa1,
            summary = "Strong contribution with practical impact.",
            recommendation = ReviewRecommendation.ACCEPT,
            scores = mapOf("originality" to 8, "technical_quality" to 8, "clarity" to 8, "relevance" to 9, "overall" to 8)
        )
        createStructuredReview(
            reviewerArticle = readyRa2,
            summary = "Minor weaknesses but overall solid.",
            recommendation = ReviewRecommendation.WEAK_ACCEPT,
            scores = mapOf("originality" to 7, "technical_quality" to 7, "clarity" to 8, "relevance" to 8, "overall" to 7)
        )
        createStructuredReview(
            reviewerArticle = readyRa3,
            summary = "Well-written and relevant to track.",
            recommendation = ReviewRecommendation.ACCEPT,
            scores = mapOf("originality" to 8, "technical_quality" to 7, "clarity" to 9, "relevance" to 9, "overall" to 8)
        )
    }

    private fun findOrCreateInstitution(name: String, website: String, country: String): Institution {
        val existing = institutionRepository.findAll().firstOrNull { !it.deleted && it.name.equals(name, ignoreCase = true) }
        if (existing != null) return existing
        return institutionRepository.save(Institution(name = name, website = website, country = country))
    }

    private fun createTopic(name: String, conference: Conference, track: Track, orderIndex: Int): Topic {
        val existing = topicRepository
            .findAllByConferenceIdAndTrackIdAndDeletedFalseOrderByOrderIndexAsc(conference.id, track.id)
            .firstOrNull { it.name.equals(name, ignoreCase = true) }
        if (existing != null) return existing

        return topicRepository.save(Topic().apply {
            this.name = name
            this.description = "$name (seeded)"
            this.isActive = true
            this.orderIndex = orderIndex
            this.conference = conference
            this.track = track
        })
    }

    private fun createUser(
        name: String,
        email: String,
        primaryRole: Role,
        extraRoles: Set<Role>,
        institution: Institution,
    ): User {
        val existing = userRepository.findByEmail(email)
        if (existing != null) return existing

        val user = User().apply {
            this.name = name
            this.email = email
            this.role = primaryRole
            this.status = AccountStatus.ACTIVE
            this.nationality = "VN"
            this.institution = institution
        }

        (extraRoles + primaryRole).forEach { role ->
            user.roles.add(UserRole().apply {
                this.user = user
                this.role = role
            })
        }

        return userRepository.save(user)
    }

    private fun createMembership(user: User, conference: Conference, role: ConferenceMembershipRole) {
        val existing = membershipRepository.findByConferenceIdAndUserIdAndDeletedFalse(conference.id, user.id)
        if (existing.isPresent) return

        membershipRepository.save(UserConferenceMembership().apply {
            this.user = user
            this.conference = conference
            this.membershipRole = role
        })
    }

    private fun findOrCreateAuthor(name: String, email: String, institution: Institution, user: User): Author {
        val existing = authorRepository.findByEmail(email)
        if (existing != null) return existing

        return authorRepository.save(Author().apply {
            this.name = name
            this.email = email
            this.institution = institution
            this.user = user
        })
    }

    private fun findOrCreateReviewer(name: String, email: String, institution: Institution, user: User): Reviewer {
        val existing = reviewerRepository.findByEmail(email)
        if (existing != null) return existing

        return reviewerRepository.save(Reviewer().apply {
            this.name = name
            this.email = email
            this.institution = institution
            this.user = user
        })
    }

    private fun createReviewerAssignment(article: Article, reviewer: Reviewer, displayIndex: Int): ReviewerArticle {
        val existing = reviewerArticleRepository.findByArticleIdAndReviewerId(article.id, reviewer.id)
        if (existing != null) return existing

        return reviewerArticleRepository.save(ReviewerArticle().apply {
            this.article = article
            this.reviewer = reviewer
            this.status = ReviewerInvitationStatus.ACCEPTED
            this.invitedAt = LocalDateTime.now().minusDays(3)
            this.displayIndex = displayIndex
        })
    }

    private fun createStructuredReview(
        reviewerArticle: ReviewerArticle,
        summary: String,
        recommendation: ReviewRecommendation,
        scores: Map<String, Int>,
    ) {
        val existing = structuredReviewRepository.findByReviewerArticleIdAndDeletedFalse(reviewerArticle.id)
        if (existing != null) return

        val review = structuredReviewRepository.save(StructuredReview().apply {
            this.reviewerArticle = reviewerArticle
            this.summaryNotes = summary
            this.confidentialRemarks = "Seeded confidential note for chair"
            this.recommendation = recommendation
            this.submittedAt = LocalDateTime.now().minusDays(1)
        })

        val entities = scores.map { (criterion, score) ->
            StructuredReviewScore().apply {
                this.structuredReview = review
                this.criterion = criterion
                this.score = score
            }
        }
        structuredReviewScoreRepository.saveAll(entities)
    }

    companion object {
        private const val SEED_CONFERENCE_SHORT_NAME = "LEGACY-2026"
    }
}
