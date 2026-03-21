package com.example.researchreview.repositories

import com.example.researchreview.entities.Topic
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface TopicRepository : JpaRepository<Topic, String> {
    fun findAllByConferenceIdAndDeletedFalseOrderByOrderIndexAsc(conferenceId: String): List<Topic>
    fun findAllByConferenceIdAndTrackIdAndDeletedFalseOrderByOrderIndexAsc(conferenceId: String, trackId: String): List<Topic>
    fun findByIdAndConferenceIdAndDeletedFalse(id: String, conferenceId: String): Optional<Topic>
    fun findAllByIdInAndConferenceIdAndTrackIdAndDeletedFalse(ids: Collection<String>, conferenceId: String, trackId: String): List<Topic>
}
