# RBAC, Admin & Collaboration Requirements

_Last updated: 2025-12-04_

## 1. Access Control Overview
- **Admins**
  - Full visibility across all tracks, articles, users, and institutions.
  - Can manage users, tracks, institutions, and global article states.
- **Editors**
  - Restricted to the articles and contributors within their assigned track(s).
  - Cannot manage users outside their track scope.
  - Manage article workflows (assign reviewers, request revisions, approve/reject) only within track.
- **Reviewers**
  - Access limited to articles they are invited to review.
  - Can view only their own review comments and responses from the researcher on that thread.
- **Researchers/Authors**
  - See reviewer comments anonymized as “Reviewer 1”, “Reviewer 2”, etc.
  - Access their own submissions and revision history.

## 2. Admin & Editor Dashboards
### 2.1 Users Management (Admin only)
- Paginated grid with filters: role, status, institution, track.
- Inline role/status updates, soft delete/reactivate, view audit trail.
- Bulk operations (status toggle, track assignment) – optional stretch.

### 2.2 Articles State Management
- Kanban or table view segmented by article status (Submitted, In Review, Revisions, Accepted, Published, Withdrawn).
- **Admin:** sees all articles from all tracks.
- **Editor:** view filtered to assigned track(s); actions limited to those articles.
- Actions include assigning reviewers, changing status (with audit + notification), attaching revision notes, and triggering emails.

### 2.3 Track Management
- CRUD for tracks: name, description, editors, status.
- Admins can create/edit/delete any track, assign editors.
- Editors can only view track metadata (unless granted explicit permission to update limited fields such as reviewer pools).

### 2.4 Institution Management
- CRUD for institutions: name, country, website, logo.
- Admin only; editors may have read-only access for context when reviewing submissions.

## 3. Comments & Reviewer Anonymity
- Reviewer comment threads are scoped per reviewer/article relationship.
- Reviewers see:
  - Their own comments.
  - Replies from the article’s researcher(s) that reference their comments.
- Researchers see:
  - Comments labeled “Reviewer X” (X derived from a deterministic display order stored on the reviewer–article link).
  - No identifiable reviewer metadata.
- Implementation detail: add `displayIndex` (or similar) to `ReviewerArticle` when linking a reviewer, ensuring stable numbering.

## 4. Notifications & Email Flows
- Notifications must be persisted (database table) with fields such as: id, userId, type, payload, readAt, createdAt.
- Events that should trigger notifications/emails (non-exhaustive):
  - Article submitted / assigned to track.
  - Reviewer invited / revoked.
  - New comment or reply in a review thread.
  - Article decision (revision requested, accepted, rejected).
  - File upload/revision submitted.
- Emails leverage existing `EmailService` templates; add new templates as needed (e.g., reviewer invitation, revision requested).
- Frontend notification center includes unread badge, grouped listing, mark-as-read actions, and deep links to the relevant entity.

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
- Every admin/editor action (role change, article status transition, reviewer assignment, file upload) should be captured via existing auditing infrastructure.
- Provide change reasons/comments where applicable (e.g., status change form includes note stored with audit record).

## 7. Open Questions / Assumptions
1. Editors manage only articles in their track; user management remains admin-only unless explicitly delegated (current assumption).
2. Reviewer numbering resets per article (i.e., Reviewer 1–N per article).
3. Notifications stored in relational DB; retention period configurable.
4. Attachment versioning aligns with article revision numbers; latest attachments flagged for active submission.
5. Notification delivery order: persist first, then send email asynchronously to avoid blocking user actions.

_Use this document as the canonical reference while implementing RBAC, admin UI, notifications, and S3-backed attachments._
