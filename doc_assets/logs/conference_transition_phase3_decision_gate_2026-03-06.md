# Conference transition phase 3 (decision gate state)

Date: 2026-03-06

## Summary

Implemented backend decision-gate transition toward chair-driven outcomes:

- Added `REVIEWS_COMPLETED` status.
- Removed reviewer-driven approve/reject request API paths.
- Added chair/editor-controlled transition from `IN_REVIEW` to `REVIEWS_COMPLETED`.
- Restricted final decision actions (`approve`, `reject`, `request revisions`) to run only from `REVIEWS_COMPLETED`.

## Changes

### 1) Article status model

Updated status enum:

- Added `REVIEWS_COMPLETED`.
- Kept `REJECT_REQUESTED` and `ACCEPT_REQUESTED` as deprecated legacy values for compatibility safety.

File:
- `backend/src/main/kotlin/com/example/researchreview/constants/ArticleStatus.kt`

### 2) Service contract updates

Updated `ArticlesService`:

- Removed:
  - `requestRejection(id)`
  - `requestApproval(id)`
- Added:
  - `markReviewsCompleted(id)`
- Retained `requestRevisions(id)` but now used as chair/editor decision action.

File:
- `backend/src/main/kotlin/com/example/researchreview/services/ArticlesService.kt`

### 3) Service implementation updates

Updated `ArticlesServiceImpl`:

- `approve(id)` now allowed only when current status is `REVIEWS_COMPLETED`.
- `reject(id)` now allowed only when current status is `REVIEWS_COMPLETED`.
- `requestRevisions(id)` now allowed only when current status is `REVIEWS_COMPLETED`.
- Added `markReviewsCompleted(id)` to move article from `IN_REVIEW` to `REVIEWS_COMPLETED`.
- Removed reviewer-driven status transitions to `REJECT_REQUESTED` / `ACCEPT_REQUESTED` from active flow.

File:
- `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt`

### 4) Controller endpoint refactor

Updated `ArticleController`:

- `assignReviewer` now allowed for `EDITOR` or `CHAIR`.
- Removed reviewer endpoints:
  - `POST /{id}/review-requests/reject`
  - `POST /{id}/review-requests/approve`
  - `POST /{id}/review-requests/revisions`
- Added gate endpoint:
  - `POST /{id}/reviews/completed` (`EDITOR`/`CHAIR`)
- Added decision revisions endpoint:
  - `POST /{id}/decision/revisions` (`EDITOR`/`CHAIR`)

File:
- `backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt`

## Notes

- This phase provides a backend gate state and removes reviewer-driven final outcome paths.
- The gate trigger is currently manual (`/reviews/completed`) until structured-review completion counting is implemented.
- Next step is structured review domain + threshold automation for `IN_REVIEW -> REVIEWS_COMPLETED`.
- Diagnostics report no Kotlin errors after changes.
