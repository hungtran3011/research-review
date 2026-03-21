package com.example.researchreview.entities

import com.example.researchreview.constants.ConferenceStatus
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "conference")
class Conference : BaseEntity() {
    var name: String = ""
    var shortName: String = ""
    var season: String? = null
    var year: Int? = null
    var description: String? = null

    @Enumerated(EnumType.STRING)
    var status: ConferenceStatus = ConferenceStatus.DRAFT

    var submissionDeadline: LocalDateTime? = null
    var minimumCompletedReviews: Int = 3
}
