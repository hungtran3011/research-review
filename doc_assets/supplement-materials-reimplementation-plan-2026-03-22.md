# Supplement Materials Processing Re-implementation Plan

Date: 2026-03-22

## 1) Current Flow (As-Is)

### 1.1 How supplemental materials are sent

- In `frontend/src/components/article/SubmitArticle.tsx`, after creating the article:
  - Main manuscript is uploaded as `AttachmentKind.SUBMISSION`, version `1`.
  - Each supplemental file is uploaded as `AttachmentKind.SUPPLEMENTAL`, version `1`.
- Upload API used by frontend service:
  - `POST /api/v1/articles/{articleId}/attachments`
  - Implemented in `frontend/src/services/attachment.service.ts`.

### 1.2 Relationship to article

- Files are stored as `Attachment` rows linked by `article_id`.
- Core fields in `Attachment` entity (`backend/src/main/kotlin/com/example/researchreview/entities/Attachment.kt`):
  - `article`, `version`, `kind`, `status`, `s3Key`, `fileName`, `mimeType`, etc.
- This is currently a flat attachment model (not a first-class “version package” model).

### 1.3 How reviewer sees supplemental files

- Reviewer UI in `frontend/src/components/article/ReviewArticle.tsx`:
  - Calls `GET /api/v1/articles/{articleId}/attachments`.
  - Filters to available attachments.
  - Renders download buttons for all kinds, including `SUPPLEMENTAL`.

### 1.4 How main article and supplements are downloaded

- Main PDF path:
  - `GET /api/v1/articles/{articleId}/pdf` (ArticlePdfService)
  - Includes only `SUBMISSION`/`REVISION`, excludes `SUPPLEMENTAL`.
- Attachment-specific path (including supplements):
  - `GET /api/v1/attachments/{attachmentId}/download-url`
  - Also direct download endpoint exists: `GET /api/v1/attachments/{attachmentId}/download`.

---

## 2) Identified Gaps

1. No explicit submission package abstraction (main + supplements grouped per version).
2. Revision flow uploads revised main file, but supplemental revision grouping is not explicit.
3. UX is attachment-centric, not version-package-centric.
4. Download semantics are split and not uniform for “version + supplements” retrieval.
5. Access and visibility rely on article-level checks but not package-level semantics.

---

## 3) Re-implementation Goals

1. Make submission materials version-centric:
   - Every version has exactly one main manuscript and zero-or-more supplemental files.
2. Ensure deterministic linkage between article, version, main file, and supplements.
3. Keep role-based visibility consistent (author/editor/reviewer/chair/admin).
4. Provide clear and consistent API for listing/downloading by version.
5. Support migration/backfill from current data without breaking existing workflows.

---

## 4) Detailed Re-implementation Plan

## Phase 1 — Domain & Data Model Redesign

### 4.1 Introduce version package aggregate

- Add `ArticleVersion` (or equivalent) with:
  - `id`, `articleId`, `versionNumber`, `mainAttachmentId`, `submittedAt`, `submittedBy`, audit fields.
- Keep `Attachment` for physical files but enforce:
  - `versionNumber` required,
  - `kind` (`SUBMISSION`, `REVISION`, `SUPPLEMENTAL`),
  - optional `isPrimary` flag for main manuscript.

### 4.2 Invariants

- Exactly 1 main file per version.
- Main file must be PDF.
- 0..N supplemental files per version.
- All attachments in a version must belong to the same article.

## Phase 2 — Backend API Contract

### 4.3 New endpoints (recommended)

- `POST /articles/{id}/versions`
  - Create version package metadata and reserve main attachment.
- `POST /articles/{id}/versions/{v}/attachments`
  - Upload/add supplemental files into a specific version package.
- `GET /articles/{id}/versions`
  - List all versions with grouped materials.
- `GET /articles/{id}/versions/{v}/main/download-url`
  - Get download URL for main manuscript of version.
- `GET /articles/{id}/versions/{v}/supplements`
  - List supplement attachments for version.
- `GET /articles/{id}/versions/{v}/supplements/{attachmentId}/download-url`
  - Download specific supplemental file.

### 4.4 Backward compatibility

- Keep existing attachment endpoints in a deprecation window.
- Dual-read strategy in frontend during migration.

## Phase 3 — Authorization & Visibility Rules

### 4.5 Access control

- Reuse `ArticleAccessGuard` for package-level operations.
- Read/download allowed only for users with article access.
- Upload allowed only for author(s) and only in allowed statuses.

### 4.6 Role behavior

- Researcher/Author: upload and view their article’s materials.
- Reviewer: read/download assigned article’s materials by version.
- Editor/Chair/Admin: full read/download for accessible article scope.

## Phase 4 — Upload Pipeline Standardization

### 4.7 Unified upload flow

1. Request upload slot (or direct upload endpoint) with `{articleId, version, kind}`.
2. Upload object to storage.
3. Finalize attachment and attach to package.

### 4.8 Validation

- Main manuscript: enforce PDF MIME/extension.
- Supplements: allow configurable MIME whitelist.
- Reject orphan finalize calls (must belong to existing package).

## Phase 5 — Frontend UX Rework

### 4.9 Submit article page

- Keep “Main manuscript” + “Supplemental materials” sections.
- Submit should create version package v1 and attach all uploaded files to v1.

### 4.10 Review article page

- Replace flat attachment list with grouped list:
  - Version N → Main manuscript + supplements
- Show clear labels and metadata:
  - kind, file name, size, uploadedAt, uploadedBy.

### 4.11 Article details page

- Add “Materials by version” panel.
- Main PDF viewer should use selected version’s main manuscript.
- Supplements displayed as separate downloadable list under selected version.

## Phase 6 — Revision Flow Alignment

### 4.12 Revision submission

- On revision submit, create next version package (`v+1`).
- Attach revised main manuscript as primary.
- Optionally support revised supplements in same action.

### 4.13 Status transitions

- Preserve existing status workflow (`REVISIONS` → `IN_REVIEW`) but ensure version package is complete before transition.

## Phase 7 — Data Migration / Backfill

### 4.14 Backfill strategy

- Group historical attachments by `{article_id, version}`.
- Determine main manuscript using priority:
  - `REVISION` or `SUBMISSION` with latest timestamp for that version.
- Assign all `SUPPLEMENTAL` of same `{article_id, version}` to the same package.

### 4.15 Ambiguity handling

- Produce migration report for problematic groups:
  - no clear main file,
  - duplicate main candidates,
  - missing version values.

## Phase 8 — Rollout Strategy

### 4.16 Incremental rollout

1. Deploy schema + dual-write support.
2. Backfill old data.
3. Switch frontend reads to package APIs.
4. Remove legacy fallback after stabilization.

### 4.17 Observability

- Add logs/metrics for:
  - upload success/failure by kind,
  - package finalize errors,
  - download URL generation errors,
  - authorization denials.

### 4.18 Envers considerations (short)

- `ArticleVersion` (new): annotate with `@Audited`; for relation to `Article`, prefer `targetAuditMode = NOT_AUDITED` unless historical article snapshot traversal is required.
- `Attachment`: keep `@Audited`; for new `ArticleVersion` relation, explicitly choose audit mode (`NOT_AUDITED` for lightweight linkage vs fully audited relation when needed).
- `Article` and hot parent entities: avoid broad new audited fields during migration to limit revision-volume growth.
- Backfill caution: run in batches and avoid repeated update-in-place writes that generate noisy Envers revisions.
- Validation: after migration, verify one representative Envers history query per affected entity and monitor revision table growth.

## Phase 9 — Testing & Acceptance

### 4.18 Backend tests

- Create article v1 with main + supplements.
- Create revision v2 with main + optional supplements.
- Access matrix by role for list/download.
- Version integrity invariants.

### 4.19 Frontend tests

- Grouped version rendering.
- Correct download actions for main vs supplements.
- Empty state and partial state behavior.

### 4.20 Acceptance criteria

- Reviewer can view/download main and supplements for each version.
- Author can submit supplements for initial and revised versions.
- No orphan attachments after migration.
- Main manuscript retrieval and supplement retrieval are clearly separated and version-aware.

---

## 5) Suggested Implementation Order (Practical)

1. Add version package schema + repository/service layer.
2. Add backend package endpoints (while keeping old ones).
3. Update SubmitArticle flow to version package writes.
4. Update ReviewArticle/ArticleDetails to grouped version reads.
5. Implement backfill script and run in staging.
6. Execute role/access regression tests.
7. Enable production dual-read/dual-write, then retire legacy paths.
