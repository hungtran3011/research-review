# Conference Model Transition Guide

_Last updated: 2026-03-06_

## Purpose

This document defines how to transition the current system from a **global-track model** to a **conference-centered model** (EasyChair-style), with minimal service disruption and clear rollback options.

Related docs:

- [flow.md](./flow.md)
- [rbac_admin_requirements.md](./rbac_admin_requirements.md)
- [review_flow_end_to_end.md](./review_flow_end_to_end.md)

---

## 1) Target model (what we are moving to)

- Publisher has many conferences over time.
- Each conference has its own tracks.
- Each track has configurable topics.
- Conference has `submissionDeadline`.
- Peer review completion is based on configured minimum completed reviews (default `3`).
- Reviewers must submit **structured review** (scores + summary notes + recommendation) in addition to inline annotations.
- Only chair sends final decision to authors after review threshold is met.

---

## 2) Current vs target mapping

### 2.1 Domain mapping

- `Track (global)` -> `Track (scoped under Conference)`
- `Article.trackId` -> `Article.conferenceId` + `Article.trackId`
- No topic linkage -> `ArticleTopic` (many-to-many)
- Reviewer inline comments only -> inline comments + structured review submission

### 2.2 Responsibility mapping

- Editor final decision -> Chair final decision
- Reviewer recommendation implicit/informal -> explicit structured recommendation enum
- Review completion implied by comment activity -> completion only after structured review submission

---

## 3) Transition strategy (phased)

## Phase 0 — Preparation

- Freeze schema assumptions and status rules in docs.
- Add feature flags:
  - `feature.conferenceModelEnabled`
  - `feature.structuredReviewEnabled`
  - `feature.reviewThresholdGateEnabled`
- Prepare migration scripts and dry-run on staging snapshot.

## Phase 1 — Data model expansion (backward-compatible)

- Add `conference` table.
- Add `conference_id` to `track` (nullable at first).
- Add `topic` table, scoped by conference/track.
- Add `article.conference_id` (nullable at first).
- Add article-topic link table.
- Add structured review tables/columns (review submission, criterion scores, recommendation, summary notes, confidential remarks, submit timestamp).
- Keep old behavior active while new columns are backfilled.

## Phase 2 — Backfill existing data

- Create a default conference (for historical data), e.g. `Legacy Conference`.
- Map all existing tracks to default conference.
- Map all existing articles to default conference using their track.
- Optionally derive initial topics from track keywords (or keep empty and require configuration later).
- Verify referential integrity and counts before/after migration.

## Phase 3 — Dual-read / dual-write window

- Reads prefer new model when present; fallback to legacy assumptions where needed.
- Writes populate both legacy-compatible and new structures (temporary).
- Enable structured review UI/API behind flag for pilot conferences.

## Phase 4 — Rule activation

- Enforce submission deadline checks in backend + frontend.
- Enforce conference/track/topic validation for submission.
- Enforce review completion threshold gate (`minimumCompletedReviews`, default `3`).
- Enforce chair-only final decision notification.

## Phase 5 — Legacy cleanup

- Remove legacy-only code paths and flags once all active conferences use new model.
- Make `conference_id` non-null where applicable.
- Tighten constraints and remove transitional compatibility logic.

---

## 4) Status/rule transition

Current review statuses remain usable; add and enforce the new gate behavior:

- `IN_REVIEW -> REVIEWS_COMPLETED` only when completed structured reviews reach threshold.
- Chair decisions (`ACCEPTED`, `REJECTED`, `REVISIONS_REQUESTED`) happen from `REVIEWS_COMPLETED`.
- Reviewer recommendation is advisory, never a direct status transition.

---

## 5) API transition expectations

## 5.1 New/updated payload fields

- Submission request must include:
  - `conferenceId`
  - `trackId`
  - `topicIds[]`
- Review submission must include:
  - criterion scores
  - summary notes
  - recommendation enum
  - optional confidential remarks

## 5.2 Compatibility period

- During migration window, old clients may still send track-only requests for legacy conference.
- Backend maps missing `conferenceId` to the default legacy conference only while compatibility flag is enabled.

---

## 6) Data migration checklist

- [ ] Conference table created and seeded.
- [ ] All tracks linked to conference.
- [ ] All articles linked to conference.
- [ ] Topic model created and linked.
- [ ] Structured review storage deployed.
- [ ] Indexes/constraints added for new joins.
- [ ] Backfill verification report approved.

---

## 7) Rollout checklist

- [ ] Feature flags configured per environment.
- [ ] Staging dry-run completed.
- [ ] Admin/chair configuration screens ready (conference, deadline, topics, review policy).
- [ ] Reviewer structured-review form enabled.
- [ ] Monitoring dashboards include:
  - submissions blocked by deadline
  - review completion threshold progress
  - decision notification events
- [ ] Rollback procedure tested.

---

## 8) Rollback plan

If major issues occur after activation:

1. Disable feature flags (`conferenceModelEnabled`, `structuredReviewEnabled`, `reviewThresholdGateEnabled`).
2. Revert API validation to legacy compatibility mode.
3. Keep new schema/tables in place (no destructive rollback during incident).
4. Re-run consistency checks and fix data before re-enabling.

---

## 9) Non-goals for this transition document

- No implementation code changes are included here.
- No UI redesign details beyond required behavior gates.
- No reviewer assignment algorithm redesign (topic-based matching is future enhancement).
