package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode
import java.time.LocalDateTime

@Entity
@Table(
    name = "article_version",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_article_version_article_version_deleted",
            columnNames = ["article_id", "version_number", "deleted"]
        )
    ]
)
@Audited
class ArticleVersion : BaseEntity() {
    @ManyToOne
    @JoinColumn(name = "article_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    lateinit var article: Article

    var versionNumber: Int = 1

    @ManyToOne
    @JoinColumn(name = "main_attachment_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var mainAttachment: Attachment? = null

    @ManyToOne
    @JoinColumn(name = "submitted_by")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var submittedBy: User? = null

    var submittedAt: LocalDateTime? = null
}