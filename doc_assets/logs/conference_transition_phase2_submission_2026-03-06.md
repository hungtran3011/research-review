# Conference transition phase 2 (submission contract + deadline enforcement)

Date: 2026-03-06

## Summary

Implemented backend hard-cutover submission contract for conference-centered model:

- Article submission now requires `conferenceId`, `trackId`, and `topicIds`.
- Backend validates conference status and submission deadline.
- Backend validates track belongs to conference and topics belong to selected conference/track.
- Added article-topic persistence through dedicated link entity/repository.

## Backend changes

### 1) Submission DTO contract

Updated article request payload:
- `conferenceId` required
- `trackId` required
- `topicIds` required (non-empty)

File:
- `backend/src/main/kotlin/com/example/researchreview/dtos/ArticleRequestDto.kt`

### 2) Article response shape

Extended article response with conference and selected topic ids:
- `conferenceId`
- `conferenceName`
- `topicIds`

File:
- `backend/src/main/kotlin/com/example/researchreview/dtos/ArticleDto.kt`

### 3) Article domain expansion

Added conference relation on article:
- `Article.conference`

File:
- `backend/src/main/kotlin/com/example/researchreview/entities/Article.kt`

### 4) Article-topic link model

Added many-to-many link entity and repository:
- `ArticleTopic` entity
- `ArticleTopicRepository`

Files:
- `backend/src/main/kotlin/com/example/researchreview/entities/ArticleTopic.kt`
- `backend/src/main/kotlin/com/example/researchreview/repositories/ArticleTopicRepository.kt`

### 5) Topic repository for scoped validation

Added scoped topic lookup:
- `findAllByIdInAndConferenceIdAndTrackIdAndDeletedFalse(...)`

File:
- `backend/src/main/kotlin/com/example/researchreview/repositories/TopicRepository.kt`

### 6) Submission service validation + persistence

Updated `ArticlesServiceImpl`:
- Injected `ConferenceRepository`, `TopicRepository`, `ArticleTopicRepository`.
- In `create(...)`:
  - loads conference by id,
  - enforces conference `ACTIVE`,
  - enforces deadline not passed,
  - loads track scoped to conference,
  - validates selected topics for conference/track and active state,
  - sets `article.conference`,
  - syncs author links,
  - syncs article-topic links.
- In `update(...)`:
  - enforces same conference/track/topic validity,
  - updates conference + track references,
  - resyncs topic links.
- Added helpers:
  - `ensureConferenceOpenForSubmission(...)`
  - `resolveSubmissionTopics(...)`
  - `syncTopics(...)`
- Included conference id in submission notification payload.
- Included topic ids + conference fields in article DTO mapping.

File:
- `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt`

## Notes

- This is backend-only contract enforcement for now; frontend submission payload and forms still need alignment to send `conferenceId` and `topicIds`.
- Existing status flow and structured review threshold gate are not yet implemented in this phase.
- Diagnostics for changed backend files are clean.
