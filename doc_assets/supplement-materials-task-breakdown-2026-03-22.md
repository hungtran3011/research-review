# Supplement Materials Re-implementation — Task Breakdown (File/Class Level)

Date: 2026-03-22  
Depends on: `doc_assets/supplement-materials-reimplementation-plan-2026-03-22.md`

## 0) Delivery Strategy

- Delivery mode: incremental (dual-read/dual-write), no big-bang cutover.
- Milestones:
  1. Schema + backend core domain.
  2. Backend APIs (new package APIs, keep legacy APIs).
  3. Frontend read/write migration.
  4. Backfill + validation.
  5. Cutover + deprecate legacy paths.

---

## 1) Backend — Data Model & Persistence

## 1.1 New entities/migrations

### Tasks

- [ ] Create entity `ArticleVersion`.
- [ ] Add relation from `Attachment` to `ArticleVersion` (or equivalent key fields).
- [ ] Add DB migration scripts for new table/indexes/constraints.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/entities/ArticleVersion.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/entities/Attachment.kt`
- [ ] `backend/src/main/resources/db/**` (Liquibase/Flyway migration files)

### Done criteria

- [ ] DB can store version package with one main and many supplements.
- [ ] Unique constraint guarantees one main manuscript per `{articleId, versionNumber}`.

## 1.2 Repositories

### Tasks

- [ ] Add repository for `ArticleVersion`.
- [ ] Add query methods for package retrieval by article/version.
- [ ] Add helpers for supplement listing and main lookup.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/repositories/ArticleVersionRepository.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/repositories/AttachmentRepository.kt`

### Done criteria

- [ ] Single-query fetch for version package with deterministic ordering.

---

## 2) Backend — Service Layer

## 2.1 New orchestration service for version packages

### Tasks

- [ ] Introduce service interface for package lifecycle (`createVersion`, `attachSupplement`, `listVersions`, `downloadMain`, `downloadSupplement`).
- [ ] Implement invariants:
  - one main per version,
  - supplements bound to existing version,
  - article ownership/access checks.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/services/ArticleVersionService.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleVersionServiceImpl.kt` (new)
- [ ] Reuse `backend/src/main/kotlin/com/example/researchreview/services/ArticleAccessGuard.kt`
- [ ] Reuse `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleAccessGuardImpl.kt`

### Done criteria

- [ ] Service methods return complete package DTOs and enforce all validation rules.

## 2.2 Refactor attachment service to package-aware writes

### Tasks

- [ ] Keep `AttachmentService` for low-level storage operations.
- [ ] Route submission/revision writes through package service.
- [ ] Preserve legacy endpoints temporarily with internal mapping to package model.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/services/AttachmentService.kt`
- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/AttachmentServiceImpl.kt`

### Done criteria

- [ ] Legacy upload endpoints still function while writing package-compatible records.

## 2.3 Revision flow integration

### Tasks

- [ ] Update revision submit flow to create `v+1` package and mark main manuscript.
- [ ] Add optional supplements for revision payload.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/services/ArticlesService.kt`
- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt`

### Done criteria

- [ ] Revision submission always produces a coherent version package.

---

## 3) Backend — API Layer

## 3.1 New package-centric endpoints

### Tasks

- [ ] Add controller for version package APIs.
- [ ] Keep response structure consistent with `BaseResponseDto`.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/controllers/ArticleVersionController.kt` (new)

### Endpoints

- [ ] `POST /api/v1/articles/{id}/versions`
- [ ] `POST /api/v1/articles/{id}/versions/{version}/attachments`
- [ ] `GET /api/v1/articles/{id}/versions`
- [ ] `GET /api/v1/articles/{id}/versions/{version}/main/download-url`
- [ ] `GET /api/v1/articles/{id}/versions/{version}/supplements`
- [ ] `GET /api/v1/articles/{id}/versions/{version}/supplements/{attachmentId}/download-url`

### Done criteria

- [ ] APIs support reviewer/editor/author workflows without using flat attachment assumptions.

## 3.2 Legacy controller compatibility

### Tasks

- [ ] Keep existing attachment endpoints functional but add deprecation markers/logging.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/controllers/AttachmentController.kt`

### Done criteria

- [ ] No breaking frontend behavior during migration window.

---

## 4) Backend — DTOs & Contracts

## 4.1 New DTOs

### Tasks

- [ ] Add version package DTOs and requests.
- [ ] Include per-version grouped materials in response.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/dtos/ArticleVersionDto.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/dtos/ArticleVersionCreateRequestDto.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/dtos/VersionSupplementDto.kt` (new)

### Done criteria

- [ ] Frontend can render grouped data without extra transformation hacks.

## 4.2 Existing DTO updates

### Tasks

- [ ] Keep `AttachmentDto` backward-compatible; add optional package fields if needed.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/dtos/AttachmentDto.kt`
- [ ] `backend/src/main/kotlin/com/example/researchreview/dtos/AttachmentUploadRequestDto.kt`

---

## 5) Frontend — Services/API Client

## 5.1 Add package API service

### Tasks

- [ ] Create new service for version package APIs.
- [ ] Keep existing `attachmentService` until full cutover.

### Target files

- [ ] `frontend/src/services/article-version.service.ts` (new)
- [ ] `frontend/src/services/attachment.service.ts` (compat layer)
- [ ] `frontend/src/services/api.ts` (if interceptor/error shape updates needed)

### Done criteria

- [ ] New endpoints consumed through typed service methods.

## 5.2 Models

### Tasks

- [ ] Add new frontend models for version package and supplements.

### Target files

- [ ] `frontend/src/models/article-version.model.ts` (new)
- [ ] `frontend/src/models/index.ts`

---

## 6) Frontend — UI/UX Migration

## 6.1 Submit Article flow

### Tasks

- [ ] Replace flat upload write flow with package-based create + attach sequence.
- [ ] Ensure v1 package creation includes main + supplements.

### Target files

- [ ] `frontend/src/components/article/SubmitArticle.tsx`

### Done criteria

- [ ] Submission always creates coherent package for version 1.

## 6.2 Review Article flow

### Tasks

- [ ] Replace flat `availableAttachments` list with grouped `versions[]` model.
- [ ] Render per-version main + supplements list.
- [ ] Keep current download UX but scope by selected version.

### Target files

- [ ] `frontend/src/components/article/ReviewArticle.tsx`

### Done criteria

- [ ] Reviewer clearly sees relationship between main manuscript and supplements for each revision.

## 6.3 Article Details flow

### Tasks

- [ ] Add “Materials by version” panel.
- [ ] Keep PDF viewer for selected version’s main file.
- [ ] Add supplement downloads under same version section.

### Target files

- [ ] `frontend/src/components/article/ArticleDetails.tsx`

### Done criteria

- [ ] Main/supplement materials are discoverable without role confusion.

## 6.4 i18n additions

### Tasks

- [ ] Add translation keys for new package/version UI labels and errors.

### Target files

- [ ] `frontend/src/locales/vi/common.json`
- [ ] `frontend/src/locales/en/common.json`

---

## 7) Security & Authorization Tasks

### Tasks

- [ ] Verify article-level checks are enforced on all package endpoints.
- [ ] Ensure supplement download cannot bypass article access.
- [ ] Validate author-only writes for submission/revision statuses.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleAccessGuardImpl.kt`
- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleVersionServiceImpl.kt` (new)
- [ ] `backend/src/main/kotlin/com/example/researchreview/services/impl/AttachmentServiceImpl.kt`

---

## 8) Data Backfill & Migration

## 8.1 Backfill script

### Tasks

- [ ] Implement backfill job that groups existing `Attachment` by `{articleId, version}`.
- [ ] Select main candidate (`REVISION`/`SUBMISSION`) by deterministic rules.
- [ ] Assign all supplements to same package.

### Target files

- [ ] `backend/src/main/kotlin/com/example/researchreview/scripts/BackfillArticleVersions.kt` (new, if script pattern exists)
- [ ] or migration SQL + service runner under `backend/src/main/resources/db/**`

### Done criteria

- [ ] No orphan attachments left after backfill.
- [ ] Backfill report generated for ambiguous cases.

---

## 9) Testing Breakdown

## 9.1 Backend tests

### Tasks

- [ ] Unit/integration tests for package service invariants.
- [ ] API tests for all new version endpoints.
- [ ] Access control tests by role matrix.

### Target files

- [ ] `backend/src/test/kotlin/**/ArticleVersionServiceImplTest.kt` (new)
- [ ] `backend/src/test/kotlin/**/ArticleVersionControllerTest.kt` (new)
- [ ] Update existing attachment/article tests as needed.

## 9.2 Frontend tests

### Tasks

- [ ] Component tests for grouped rendering in review/details pages.
- [ ] Service tests for version API integration.

### Target files

- [ ] `frontend/src/components/article/__tests__/ReviewArticle*.test.tsx` (new/update)
- [ ] `frontend/src/components/article/__tests__/ArticleDetails*.test.tsx` (new/update)
- [ ] `frontend/src/services/__tests__/article-version.service.test.ts` (new)

---

## 10) Rollout Checklist

## Stage A — Safe introduction

- [ ] Deploy schema + backend dual-write support.
- [ ] Keep old read APIs active.

## Stage B — Frontend migration

- [ ] Switch UI reads to package endpoints behind feature flag.
- [ ] Monitor logs/errors.

## Stage C — Cleanup

- [ ] Remove old read path from UI.
- [ ] Deprecate legacy attachment listing semantics.
- [ ] Retain compatibility wrappers until confidence threshold met.

---

## 10.1 Envers Notes (Short)

### `ArticleVersion` (new)

- [ ] Annotate with `@Audited`.
- [ ] If relation to `Article` is `@ManyToOne`, prefer `@Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)` when article snapshot history is not required on version revisions.
- [ ] Caution: backfill can generate many revisions; run backfill in batches and avoid frequent update-in-place patterns that create noisy audit history.

### `Attachment`

- [ ] Keep `@Audited` on entity (or add it if missing).
- [ ] For new relation to `ArticleVersion`, annotate relation with explicit audit mode:
  - use `targetAuditMode = NOT_AUDITED` for lightweight linkage history, or
  - keep fully audited relation only if historical graph traversal is required.
- [ ] Caution: dual-write phase may create duplicate revision events for one business action; prefer single transactional write path and avoid redundant post-save updates.

### `Article` / parent references

- [ ] Do not enable broad new audited fields unless required by query/audit use-cases.
- [ ] Keep existing audited surface minimal to prevent revision explosion during migration.
- [ ] Caution: changing audited mapping on hot entities can impact Envers query performance; verify index coverage on revision tables after deployment.

### Migration cautions (Envers)

- [ ] Confirm schema migration includes Envers audit table compatibility for new audited entity/columns.
- [ ] Validate one representative Envers query per entity after migration (read latest + historical revision).
- [ ] Document expected revision-count increase during backfill and set temporary monitoring thresholds.

---

## 11) Definition of Done (Project-Level)

- [ ] Version packages are first-class and complete for every new submission/revision.
- [ ] Reviewers can identify and download main + supplemental files by version.
- [ ] Authors can upload supplements in both initial submission and revision flow.
- [ ] Access rules are enforced consistently across all download/upload endpoints.
- [ ] Migration leaves no orphan/ambiguous production data.
- [ ] Legacy path can be disabled without user-facing regressions.
