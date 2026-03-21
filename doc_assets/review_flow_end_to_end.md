# End-to-end reviewing flow (Submit → Decision)

This document describes the **end-to-end workflow** of the project from article submission to the end of the reviewing process, including the revision loop.

Related docs:

- Existing high-level flow notes: [flow.md](./flow.md)
- RBAC notes: [rbac_admin_requirements.md](./rbac_admin_requirements.md)
- Transition guide: [conference_transition_guide.md](./conference_transition_guide.md)
- Testing guide: [testing_guide.md](./testing_guide.md)

---

## Roles

- **Author / Researcher**: submits article, views reviewer comments, replies, uploads revisions.
- **Chair**: owns conference configuration, review policy, and final decision authority.
- **Editor**: delegated operator inside a conference/track, performs screening, invites reviewers, and manages review progress.
- **Reviewer**: accepts/declines invitations, reviews assigned articles, adds comments/threads.
- **Admin** (if enabled): manages users/roles/conferences/tracks/topics.

---

## Core entities (mental model)

- **Conference**: top-level event owned by the publisher, with deadline and review policy.
- **Track**: belongs to one conference.
- **Topic**: belongs to a track or conference taxonomy and is selected during submission.
- **Article**: the main record, with a `status` field (workflow state).
  - Each article belongs to exactly one conference and one track.
  - Each article may have one or more selected topics.
- **Attachments (PDFs)**: versioned PDFs of the submission and revisions.
  - Submission PDF is stored as `kind=SUBMISSION`, typically `version=1`.
  - Revision PDFs are stored as `kind=REVISION`, `version=2..N`.
- **Comment threads**: anchored feedback on a specific PDF version (reviewer comments, author replies).
- **Structured review**: per-reviewer submission containing scores, summary notes, confidential remarks, and a recommendation. This is the formal "review completion" artifact.
- **Reviewer invitations**: an invite must be **accepted** before the article moves into active review.
- **Review policy**: stores minimum completed reviews required before a chair decision can be made, normally `3`. Also stores the scoring criteria configuration.
- **Notifications**: email + in-app notifications are used to keep actors informed (invites, status changes, comment activity, revision submission, etc.).

---

## Article statuses (source of truth)

Backend enum (and mirrored in frontend constants):

- `SUBMITTED`: new submission, waiting for editor initial handling.
- `PENDING_REVIEW`: ready to invite reviewers / waiting for reviewer acceptance.
- `IN_REVIEW`: active review in progress.
- `REVIEWS_COMPLETED`: minimum required reviews completed; waiting for chair decision.
- `REJECTED`: chair/editor rejected.
- `REVISIONS_REQUESTED`: revisions requested (author needs to fix).
- `REVISIONS`: author is actively revising.
- `ACCEPTED`: chair accepted.

Notes:

- `REVIEWS_COMPLETED` is the preferred workflow state for an EasyChair-style process.
- Reviewer recommendations should not directly change the article to `ACCEPT_REQUESTED` or `REJECT_REQUESTED`.
- The final author-facing decision is produced only by the chair.

---

## High-level state transitions

### Main path

1. **Submit before deadline**: `SUBMITTED`
2. **Initial review (Chair/Editor)**:
   - reject → `REJECTED`
   - request changes early → `REVISIONS_REQUESTED`
   - send to reviewers → `PENDING_REVIEW`
3. **Invite reviewers (Editor)**: stays `PENDING_REVIEW` until acceptance
4. **Reviewer accepts invitation**: `PENDING_REVIEW → IN_REVIEW`
5. **Review + comments (Reviewer)**: remains `IN_REVIEW` until the minimum number of reviews are completed
6. **Minimum completed review threshold reached**: `IN_REVIEW → REVIEWS_COMPLETED`
7. **Chair decision / Revision loop**:

- request revisions → `REVIEWS_COMPLETED → REVISIONS_REQUESTED`
- accept → `REVIEWS_COMPLETED → ACCEPTED`
- reject → `REVIEWS_COMPLETED → REJECTED`

8. **Formal notification to authors (Chair action)**:
   - accept → `ACCEPTED`
   - reject → `REJECTED`

- revisions required → `REVISIONS_REQUESTED`

### Revision loop

- `REVIEWS_COMPLETED → REVISIONS_REQUESTED`
- author starts working: `REVISIONS_REQUESTED → REVISIONS`
- author submits revision PDF: `REVISIONS/REVISIONS_REQUESTED → IN_REVIEW`
- loop repeats until final decision.

---

## Detailed flow (step-by-step)

### 1) Submission (Author)

- Author chooses conference, track, one or more topics, then submits metadata + PDF.
- Backend validates the conference is active and the current time is before `submissionDeadline`.
- System creates `Article` with status `SUBMITTED`.
- System creates an attachment for the PDF (submission version).
- System notifies co-authors and/or relevant parties (email + in-app, depending on configuration).

### 2) Initial review (Chair/Editor)

Editor performs screening and decides one of:

- **Reject**: status becomes `REJECTED` (reason is recorded and sent to authors).
- **Request changes immediately**: status becomes `REVISIONS_REQUESTED`.
- **Send to review**: status becomes `PENDING_REVIEW`.

### 3) Contacting / inviting reviewers (Editor)

- Editor can invite reviewers when article is `PENDING_REVIEW`.
- The UI should show the selected topics to help the editor/chair pick suitable reviewers.
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

#### Review submission (structured review)

In addition to inline annotations, each reviewer must submit a **structured review** to complete their review. A review is only considered "completed" once this structured submission exists.

The structured review consists of:

1. **Scores** — numerical ratings on predefined criteria. Suggested default criteria (configurable per conference/track):
   - Originality (1–10)
   - Technical quality (1–10)
   - Clarity of presentation (1–10)
   - Relevance to conference/track topics (1–10)
   - Overall recommendation score (1–10)
2. **Summary notes** — a free-text overall assessment visible to the chair and (anonymized) to authors. Should include:
   - Summary of the paper
   - Strengths
   - Weaknesses
   - Questions for the authors
3. **Confidential remarks to the chair** — optional free-text visible only to the chair, never shown to authors.
4. **Recommendation** — the reviewer's suggested decision, one of:
   - `STRONG_ACCEPT`
   - `ACCEPT`
   - `WEAK_ACCEPT`
   - `BORDERLINE`
   - `WEAK_REJECT`
   - `REJECT`
   - `STRONG_REJECT`

Important rules:

- A reviewer may save drafts of their structured review before final submission.
- Once submitted, the review is locked for that review round unless the chair explicitly reopens it.
- Each reviewer submission updates a review completion counter for the current round.
- The recommendation is an input for the chair, **not** a binding decision.

Completion rule:

- The conference or track defines `minimumCompletedReviews`.
- The normal default is `3`.
- Only completed reviews count toward the threshold.
- Accepted invitations without submitted reviews do not count.

When the threshold is reached:

- the article moves to `REVIEWS_COMPLETED`,
- the system aggregates reviewer recommendations and summary data,
- the system notifies the chair that the article is ready for decision.

### 6) Chair decision after reviews completed

- The chair reviews the inline annotations, structured review scores/summaries/recommendations, confidential remarks, and article history.
- The dashboard should present an aggregated view: average scores per criterion, recommendation distribution, and all summary notes.
- Allowed when the article is in `REVIEWS_COMPLETED`.
- The chair can decide:
  - **Request revisions**: status becomes `REVISIONS_REQUESTED`
  - **Accept**: status becomes `ACCEPTED`
  - **Reject**: status becomes `REJECTED`
- Only the chair action sends the formal decision email to the authors.

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
  - resets the review completion counter for the new review round,
  - notifies reviewers/editor that a revision was submitted.

### 9) Final decision result handling

- If the chair accepts, the article becomes `ACCEPTED` and authors are notified.
- If the chair rejects, the article becomes `REJECTED` and authors are notified.
- If the chair requests revisions, the article becomes `REVISIONS_REQUESTED` and authors are notified.

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

- Status transitions are enforced in service logic (e.g., some actions are only allowed when the article is `IN_REVIEW` or `REVIEWS_COMPLETED`).
- DB check constraints should be kept consistent with enum expansions (e.g., `article_status_check`).
- Revision history is preserved by storing each PDF as a distinct attachment version rather than overwriting the existing file.
- Conference/track/topic relationships must be validated on every submission and article update.
- Submission deadline must be enforced both in UI and backend validation.
- Review completion thresholds must be configurable, but default to `3`.
