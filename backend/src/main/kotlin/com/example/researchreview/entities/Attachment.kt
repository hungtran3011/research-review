package com.example.researchreview.entities

import com.example.researchreview.constants.AttachmentKind
import com.example.researchreview.constants.AttachmentStatus
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.envers.Audited
import org.hibernate.envers.RelationTargetAuditMode

@Entity
@Table(name = "attachment")
class Attachment : BaseEntity() {
    @ManyToOne
    @JoinColumn(name = "article_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var article: Article = Article()

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    var uploadedBy: User? = null

    var version: Int = 1
    var fileName: String = ""
    var fileSize: Long = 0
    var mimeType: String = "application/octet-stream"
    var checksum: String? = null
    var s3Key: String = ""

    @Enumerated(EnumType.STRING)
    var kind: AttachmentKind = AttachmentKind.SUBMISSION

    @Enumerated(EnumType.STRING)
    var status: AttachmentStatus = AttachmentStatus.PENDING_UPLOAD
}
