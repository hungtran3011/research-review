# Conference transition phase 1 (role + membership foundation)

Date: 2026-03-06

## Summary

Implemented the first executable slice of the conference-centered transition plan:

- Added CHAIR role support.
- Introduced explicit user-conference membership model.
- Added admin APIs to manage conference memberships.
- Allowed chair role on key article review/decision/reviewer-contact endpoints.

## Backend changes

### 1) Role foundation

- Updated `Role` enum to include `CHAIR` (appended to avoid ordinal shifts):
  - `backend/src/main/kotlin/com/example/researchreview/constants/Role.kt`

### 2) Conference membership domain

- Added membership role enum:
  - `backend/src/main/kotlin/com/example/researchreview/constants/ConferenceMembershipRole.kt`
- Added entity:
  - `backend/src/main/kotlin/com/example/researchreview/entities/UserConferenceMembership.kt`
- Added repository:
  - `backend/src/main/kotlin/com/example/researchreview/repositories/UserConferenceMembershipRepository.kt`

### 3) Membership DTOs and service contract

- Added DTOs:
  - `backend/src/main/kotlin/com/example/researchreview/dtos/ConferenceMembershipAssignRequestDto.kt`
  - `backend/src/main/kotlin/com/example/researchreview/dtos/ConferenceMembershipDto.kt`
- Extended user response DTO to include memberships:
  - `backend/src/main/kotlin/com/example/researchreview/dtos/UserDto.kt`
- Extended admin configuration service interface and implementation with:
  - `getConferenceMembers`
  - `assignConferenceMember`
  - `removeConferenceMember`
  - Files:
    - `backend/src/main/kotlin/com/example/researchreview/services/AdminConfigurationService.kt`
    - `backend/src/main/kotlin/com/example/researchreview/services/impl/AdminConfigurationServiceImpl.kt`

### 4) Admin API endpoints for conference membership

Added under `/api/v1/admin/configuration`:

- `GET /conferences/{conferenceId}/members`
- `POST /conferences/{conferenceId}/members`
- `DELETE /conferences/{conferenceId}/members/{userId}`

File:
- `backend/src/main/kotlin/com/example/researchreview/controllers/AdminConfigurationController.kt`

### 5) Chair access in article flow (intermediate)

- Updated endpoint guards to `EDITOR or CHAIR`:
  - initial review
  - reviewer contact
  - final approve/reject decision

File:
- `backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt`

- Updated article access guard to treat CHAIR as privileged access (temporary until conference-scoped filtering is fully implemented):
  - `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleAccessGuardImpl.kt`

### 6) User mapping updates

- Included conference memberships in `UserDto` mapping:
  - `backend/src/main/kotlin/com/example/researchreview/services/impl/UsersServiceImpl.kt`

## Notes

- This phase intentionally focuses on foundation only; submission contract migration (`conferenceId`, `topicIds`) and deadline enforcement are not yet implemented in this step.
- Diagnostics in VS Code report no Kotlin errors after changes.
