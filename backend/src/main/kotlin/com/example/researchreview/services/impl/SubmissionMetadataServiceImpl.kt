package com.example.researchreview.services.impl

import com.example.researchreview.constants.ConferenceStatus
import com.example.researchreview.dtos.SubmissionConferenceOptionDto
import com.example.researchreview.dtos.SubmissionMetadataDto
import com.example.researchreview.dtos.SubmissionTopicOptionDto
import com.example.researchreview.dtos.SubmissionTrackOptionDto
import com.example.researchreview.repositories.ConferenceRepository
import com.example.researchreview.repositories.TopicRepository
import com.example.researchreview.repositories.TrackRepository
import com.example.researchreview.services.SubmissionMetadataService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SubmissionMetadataServiceImpl(
    private val conferenceRepository: ConferenceRepository,
    private val trackRepository: TrackRepository,
    private val topicRepository: TopicRepository,
) : SubmissionMetadataService {

    @Transactional(readOnly = true)
    override fun getSubmissionMetadata(): SubmissionMetadataDto {
        val conferences = conferenceRepository.findAllByDeletedFalse()
            .asSequence()
            .filter { it.status == ConferenceStatus.ACTIVE }
            .map { conference ->
                val tracks = trackRepository.findAllByConferenceIdAndDeletedFalse(conference.id)
                    .asSequence()
                    .filter { it.isActive }
                    .map { track ->
                        val topics = topicRepository.findAllByConferenceIdAndTrackIdAndDeletedFalseOrderByOrderIndexAsc(
                            conference.id,
                            track.id,
                        )
                            .asSequence()
                            .filter { it.isActive }
                            .map { topic ->
                                SubmissionTopicOptionDto(
                                    id = topic.id,
                                    name = topic.name,
                                )
                            }
                            .toList()

                        SubmissionTrackOptionDto(
                            id = track.id,
                            name = track.name,
                            topics = topics,
                        )
                    }
                    .toList()

                SubmissionConferenceOptionDto(
                    id = conference.id,
                    name = conference.name,
                    shortName = conference.shortName,
                    submissionDeadline = conference.submissionDeadline,
                    tracks = tracks,
                )
            }
            .toList()

        return SubmissionMetadataDto(conferences = conferences)
    }
}
