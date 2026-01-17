# End-to-end reviewing flow (Submit → Decision)

This document describes the **end-to-end workflow** of the project from article submission to the end of the reviewing process, including the revision loop.

Related docs:

- Existing high-level flow notes: [flow.md](./flow.md)
- RBAC notes: [rbac_admin_requirements.md](./rbac_admin_requirements.md)
- Testing guide: [testing_guide.md](./testing_guide.md)

---

## Roles

- **Author / Researcher**: submits article, views reviewer comments, replies, uploads revisions.
- **Editor**: performs initial screening, invites reviewers, requests revisions, finalizes decision.
- **Reviewer**: accepts/declines invitations, reviews assigned articles, adds comments/threads.
- **Admin** (if enabled): manages users/roles/tracks.

---

## Core entities (mental model)

- **Article**: the main record, with a `status` field (workflow state).
- **Attachments (PDFs)**: versioned PDFs of the submission and revisions.
  - Submission PDF is stored as `kind=SUBMISSION`, typically `version=1`.
  - Revision PDFs are stored as `kind=REVISION`, `version=2..N`.
- **Comment threads**: anchored feedback on a specific PDF version (reviewer comments, author replies).
- **Reviewer invitations**: an invite must be **accepted** before the article moves into active review.
- **Notifications**: email + in-app notifications are used to keep actors informed (invites, status changes, comment activity, revision submission, etc.).

---

## Article statuses (source of truth)

Backend enum (and mirrored in frontend constants):

- `SUBMITTED`: new submission, waiting for editor initial handling.
- `REJECTED`: editor rejected.
- `PENDING_REVIEW`: ready to invite reviewers / waiting for reviewer acceptance.
- `IN_REVIEW`: active review in progress.
- `REVISIONS_REQUESTED`: revisions requested (author needs to fix).
- `REVISIONS`: author is actively revising.
- `REJECT_REQUESTED`: reviewer/editor requested rejection (pending editor finalize).
- `ACCEPT_REQUESTED`: reviewer/editor requested acceptance (pending editor finalize).
- `ACCEPTED`: editor accepted.

---

## High-level state transitions

### Main path

1. **Submit**: `SUBMITTED`
2. **Initial review (Editor)**:
   - reject → `REJECTED`
   - request changes early → `REVISIONS_REQUESTED`
   - send to reviewers → `PENDING_REVIEW`
3. **Invite reviewers (Editor)**: stays `PENDING_REVIEW` until acceptance
4. **Reviewer accepts invitation**: `PENDING_REVIEW → IN_REVIEW`
5. **Review + comments (Reviewer)**: remains `IN_REVIEW`
6. **Decision / Revision loop**:
   - request revisions → `IN_REVIEW → REVISIONS_REQUESTED`
   - request accept → `IN_REVIEW → ACCEPT_REQUESTED`
   - request reject → `IN_REVIEW → REJECT_REQUESTED`
7. **Finalize (Editor)**:
   - accept → `ACCEPTED`
   - reject → `REJECTED`

### Revision loop

- `IN_REVIEW → REVISIONS_REQUESTED`
- author starts working: `REVISIONS_REQUESTED → REVISIONS`
- author submits revision PDF: `REVISIONS/REVISIONS_REQUESTED → IN_REVIEW`
- loop repeats until final decision.

---

## Detailed flow (step-by-step)

### 1) Submission (Author)

- Author submits metadata + PDF.
- System creates `Article` with status `SUBMITTED`.
- System creates an attachment for the PDF (submission version).
- System notifies co-authors and/or relevant parties (email + in-app, depending on configuration).

### 2) Initial review (Editor)

Editor performs screening and decides one of:

- **Reject**: status becomes `REJECTED` (reason is recorded and sent to authors).
- **Request changes immediately**: status becomes `REVISIONS_REQUESTED`.
- **Send to review**: status becomes `PENDING_REVIEW`.

### 3) Contacting / inviting reviewers (Editor)

- Editor can invite reviewers when article is `PENDING_REVIEW`.
- Each invitation:
  - sends **email** to the reviewer,
  - creates **in-app notification**,
  - creates a reviewer invitation record with an invitation status (e.g., PENDING).

Important gating rule:

- The article **must not** enter active review just because the editor invited someone.
- The article transitions to `IN_REVIEW` only when a reviewer **accepts** the invitation.

### 4) Invitation decision (Reviewer)

- Reviewer opens the invite (via link or in-app) and chooses **Accept** or **Decline**.
- If **Accept** and the article is `PENDING_REVIEW`:
  - invitation status becomes ACCEPTED
  - article transitions `PENDING_REVIEW → IN_REVIEW`
- If **Decline**:
  - invitation status becomes DECLINED
  - article status does not progress (editor can invite others).

### 5) Peer review & commenting (Reviewer ↔ Author)

While `IN_REVIEW`:

- Reviewers add comment threads / annotations (typically anonymous from the author perspective).
- Authors can view all reviewer threads and reply.
- System emits notifications on comment activity (for the intended recipients).

### 6) Request revisions (Editor)

- Editor requests revisions when the article is `IN_REVIEW`.
- Status becomes `REVISIONS_REQUESTED`.
- System notifies author(s).

### 7) Start revisions (Author)

- When the author begins working, the system may transition:
  - `REVISIONS_REQUESTED → REVISIONS`

(Depending on UI, this can happen when the author clicks “Start revisions” / “Begin fixing”.)

### 8) Submit revision (Author)

- Allowed when status is `REVISIONS` or `REVISIONS_REQUESTED`.
- Author uploads the revised PDF.
- System:
  - creates a new attachment version (`kind=REVISION`, `version=N`),
  - keeps old versions intact,
  - transitions article back to active review: `… → IN_REVIEW`,
  - notifies reviewers/editor that a revision was submitted.

### 9) Final decision (Editor)

During `IN_REVIEW`, reviewers/editor may request a decision:

- request acceptance: `IN_REVIEW → ACCEPT_REQUESTED`
- request rejection: `IN_REVIEW → REJECT_REQUESTED`

Editor then finalizes:

- accept: `ACCEPTED`
- reject: `REJECTED`

---

## PDF version access (important for audit/history)

To avoid expiring links and to keep old revisions accessible, PDFs are accessed via the **stable proxy endpoint**:

- `GET /api/v1/articles/{id}/pdf` (latest)
- `GET /api/v1/articles/{id}/pdf?version=N` (specific version)

This ensures:

- older revisions remain accessible,
- access is controlled by the backend (authz),
- the frontend can reliably render PDFs without relying on short-lived presigned URLs.

---

## Notes / invariants

- Status transitions are enforced in service logic (e.g., some actions are only allowed when the article is `IN_REVIEW`).
- DB check constraints should be kept consistent with enum expansions (e.g., `article_status_check`).
- Revision history is preserved by storing each PDF as a distinct attachment version rather than overwriting the existing file.
