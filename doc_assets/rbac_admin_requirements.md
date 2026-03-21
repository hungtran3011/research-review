# RBAC, Admin & Collaboration Requirements

_Last updated: 2026-03-06_

## 1. Access Control Overview

- **Admins**
  - Full visibility across all conferences, tracks, topics, articles, users, and institutions.
  - Can manage users, conferences, tracks, topics, institutions, and global article states.
- **Chairs**
  - Scoped to one or more conferences, and optionally all tracks under those conferences.
  - Own conference configuration such as submission deadline, review thresholds, and decision authority.
  - Can finalize decisions and send the official decision to authors.
- **Editors**
  - Restricted to the articles and contributors within their assigned conference/track scope.
  - Cannot manage users outside their scope.
  - Manage delegated article workflows (assign reviewers, request revisions, monitor review progress) only within scope.
  - Do not send the official final decision unless explicitly granted chair authority.
- **Reviewers**
  - Access limited to articles they are invited to review.
  - Can view only their own review comments and responses from the researcher on that thread.
- **Researchers/Authors**
  - See reviewer comments anonymized as “Reviewer 1”, “Reviewer 2”, etc.
  - Access their own submissions and revision history.

## 2. Admin & Editor Dashboards

### 2.1 Users Management (Admin only)

- Paginated grid with filters: role, status, institution, conference, track.
- Inline role/status updates, soft delete/reactivate, view audit trail.
- Bulk operations (status toggle, conference assignment, track assignment) – optional stretch.

### 2.2 Conference Management

- CRUD for conferences: name, short name/code, year/season, description, status.
- Conference-level settings:
  - `submissionDeadline`
  - review completion threshold (default `3`)
  - decision notification templates
  - chair assignments
- Admins can create/edit/delete any conference.
- Chairs can update only their own conference settings.

### 2.3 Articles State Management

- Kanban or table view segmented by article status (Submitted, In Review, Revisions, Accepted, Published, Withdrawn).
- **Admin:** sees all articles from all conferences.
- **Chair:** view filtered to assigned conference(s), with the ability to finalize decisions.
- **Editor:** view filtered to assigned conference/track scope; actions limited to those articles.
- Articles must show conference, track, selected topics, deadline context, reviewer progress, and review threshold progress.
- Actions include assigning reviewers, changing status (with audit + notification), attaching revision notes, and triggering emails.

### 2.4 Track Management

- CRUD for tracks under a conference: name, description, editors, status, review policy overrides.
- Admins can create/edit/delete any track, assign chairs/editors.
- Chairs can manage tracks inside their conferences.
- Editors can only view track metadata unless granted explicit permission to update limited fields such as reviewer pools.

### 2.5 Topic Management

- Topics are configured under a track or conference-defined taxonomy.
- Admins/chairs can activate, deactivate, reorder, merge, or retire topics.
- Submission forms must use only active topics from the selected conference/track.
- Reviewer expertise matching should later use topic selections.

### 2.6 Institution Management

- CRUD for institutions: name, country, website, logo.
- Admin only; editors may have read-only access for context when reviewing submissions.

## 3. Comments, Structured Reviews & Reviewer Anonymity

### 3.1 Inline annotations

- Reviewer comment threads are scoped per reviewer/article relationship.
- Reviewers see:
  - Their own comments.
  - Replies from the article's researcher(s) that reference their comments.
- Researchers see:
  - Comments labeled "Reviewer X" (X derived from a deterministic display order stored on the reviewer–article link).
  - No identifiable reviewer metadata.
- Implementation detail: add `displayIndex` (or similar) to `ReviewerArticle` when linking a reviewer, ensuring stable numbering.

### 3.2 Structured review submission

Each reviewer must submit a structured review to mark their review as complete. This includes:

- **Scores**: numerical ratings (1–10) on configurable criteria (e.g., originality, technical quality, clarity, relevance, overall).
- **Summary notes**: free-text assessment (summary, strengths, weaknesses, questions) — shown anonymized to authors.
- **Confidential remarks to the chair**: optional free-text, visible **only** to the chair.
- **Recommendation**: `STRONG_ACCEPT | ACCEPT | WEAK_ACCEPT | BORDERLINE | WEAK_REJECT | REJECT | STRONG_REJECT`.

Visibility rules:

- **Reviewers** see only their own structured review.
- **Authors** see anonymized summary notes and scores (labeled "Reviewer X"). They do **not** see confidential remarks or the recommendation value.
- **Chair** sees all structured reviews in full, including confidential remarks and recommendations, with reviewer identity.
- **Editor** sees structured reviews without reviewer identity (same anonymized view as authors) unless the chair grants elevated access.

## 4. Notifications & Email Flows

- Notifications must be persisted (database table) with fields such as: id, userId, type, payload, readAt, createdAt.
- Events that should trigger notifications/emails (non-exhaustive):
  - Article submitted to a conference / assigned to track.
  - Reviewer invited / revoked.
  - New comment or reply in a review thread.
  - Minimum completed review threshold reached.
  - Chair decision (revision requested, accepted, rejected).
  - File upload/revision submitted.
- Emails leverage existing `EmailService` templates; add new templates as needed (e.g., reviewer invitation, revision requested).
- Frontend notification center includes unread badge, grouped listing, mark-as-read actions, and deep links to the relevant entity.

Decision notification rule:

- Reviewer recommendations are internal.
- When the configured number of reviewers have completed their review (normally `3`), notify the chair.
- Only the chair action sends the official decision email to authors.

## 5. File Uploads & Attachments

- Files uploaded to S3; bucket configuration read from application properties (e.g., `custom.s3.bucket`, region, access keys).
- Workflow:
  1. Client requests an upload and receives a presigned URL plus attachment metadata ID.
  2. Client uploads directly to S3.
  3. Client confirms upload, passing checksum/metadata so backend finalizes attachment record linked to article/revision.
- Metadata stored with auditing (createdBy, createdAt, version, file name, size, MIME, checksum, S3 key).
- Attachment linkage supports:
  - Original submission files.
  - Revision files per review cycle (versioned attachments).
  - Reviewer supplementary files if needed (future-proof).
- Download endpoints enforce RBAC (only authorized roles can fetch attachments).

## 6. Auditing Expectations

- Every admin/chair/editor action (role change, conference setting update, submission deadline change, topic change, article status transition, reviewer assignment, file upload) should be captured via existing auditing infrastructure.
- Provide change reasons/comments where applicable (e.g., status change form includes note stored with audit record).

## 7. Open Questions / Assumptions

1. A publisher can host many conferences over time; tracks are never global.
2. Chairs own final decision authority; editors are delegated operators unless granted chair permission.
3. Reviewer numbering resets per article (i.e., Reviewer 1–N per article).
4. Notifications stored in relational DB; retention period configurable.
5. Attachment versioning aligns with article revision numbers; latest attachments flagged for active submission.
6. Notification delivery order: persist first, then send email asynchronously to avoid blocking user actions.
7. Minimum completed reviews defaults to `3`, but each conference may override it.

_Use this document as the canonical reference while implementing RBAC, conference/track/topic administration, notifications, and S3-backed attachments._
