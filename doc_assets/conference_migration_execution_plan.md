# Conference Migration Execution Plan

_Last updated: 2026-03-21_

This file is the actionable implementation plan derived from:
- `doc_assets/conference_transition_guide.md`
- `doc_assets/flow.md`
- `doc_assets/rbac_admin_requirements.md`
- `doc_assets/review_flow_end_to_end.md`

## Scope
- Transition from global-track model to conference-centered model.
- Enforce structured reviews and review-threshold gating.
- Preserve compatibility during rollout with feature flags and rollback safety.

---

## Phase A — Stabilize Current Baseline (UI/Auth/API)

### Goal
Stabilize recently changed auth + UI behavior before deeper migration work.

### TODOs
- [ ] Re-verify auth happy paths: sign-in, sign-up verify, sign-out, resend cooldown.
- [ ] Verify device-bound magic-link behavior on same device vs other device.
- [ ] Re-check controller error responses for semantic HTTP status consistency.
- [ ] Fix remaining responsive issues in `ArticleDetails` and top navigation.
- [ ] Capture and document known UI regressions with screenshots.

### Exit Criteria
- No blocker regressions in auth and core article pages.
- Mobile/tablet/desktop navigation and side panels behave consistently.

---

## Phase B — Data Model Expansion + Compatibility Layer

### Goal
Introduce conference-scoped schema and keep legacy compatibility during transition.

### TODOs
- [ ] Add/verify `conference` entity + table.
- [ ] Add/verify `track.conference_id` (nullable during transition).
- [ ] Add/verify `topic` model scoped by conference/track.
- [ ] Add/verify `article.conference_id` (nullable during transition).
- [ ] Add/verify article-topic join (`article_topic`).
- [ ] Add/verify indexes for conference/track/topic joins.
- [ ] Implement compatibility mapping for legacy track-only submissions.
- [ ] Add default legacy conference resolution path behind feature flag.

### Exit Criteria
- New schema runs with existing traffic.
- Legacy clients can still submit through compatibility mode.

---

## Phase C — Structured Review Domain

### Goal
Make structured review the official completion artifact for reviewer work.

### TODOs
- [ ] Add structured review entities/tables (per reviewer, per round).
- [ ] Add score criteria model/config (conference/track configurable).
- [ ] Add recommendation enum:
  - `STRONG_ACCEPT`, `ACCEPT`, `WEAK_ACCEPT`, `BORDERLINE`, `WEAK_REJECT`, `REJECT`, `STRONG_REJECT`.
- [ ] Add fields for summary notes and confidential remarks.
- [ ] Add draft/save/submit lifecycle (submitted review becomes locked).
- [ ] Expose APIs for reviewer create/update/submit structured review.
- [ ] Enforce visibility rules:
  - authors: anonymized score + summary only,
  - chair: full review with identity + confidential remarks,
  - editor: anonymized unless elevated.

### Exit Criteria
- Structured review can be submitted and queried per role with correct visibility.

---

## Phase D — Workflow Gate Enforcement

### Goal
Enforce status transitions using review completion thresholds and chair authority.

### TODOs
- [x] Enforce `IN_REVIEW -> REVIEWS_COMPLETED` only by completed structured-review count.
- [x] Add configurable `minimumCompletedReviews` with default `3`.
- [x] Ensure invitation acceptance and completion are distinct states.
- [x] Restrict formal final decision actions to chair authority.
- [x] Restrict formal decision emails to chair-triggered actions only.
- [x] Add transition guards with explicit error responses.

### Exit Criteria
- State machine matches documented flow and cannot bypass threshold/authority rules.

---

## Phase E — Frontend Feature Completion

### Goal
Expose conference-centered submission and structured-review UX.

### TODOs
- [x] Update submission UI: `conferenceId`, `trackId`, `topicIds[]` required.
- [x] Show and enforce conference submission deadline in UI.
- [x] Block submit in UI when deadline is passed.
- [x] Add structured-review form (scores, summary, recommendation, confidential remarks).
- [x] Add reviewer completion indicators and round status.
- [x] Add chair view for aggregated scores + recommendation distribution.
- [x] Ensure author view is anonymized and excludes confidential remarks.

### Exit Criteria
- Frontend enforces required fields and reflects role-specific review views.

---

## Phase F — Rollout Controls (Flags, Migration, Rollback)

### Goal
Deploy safely with observability and reversible activation.

### TODOs
- [x] Add/verify feature flags:
  - `feature.conferenceModelEnabled`
  - `feature.structuredReviewEnabled`
  - `feature.reviewThresholdGateEnabled`
- [x] Add local demo seed toggle (`feature.demoSeedEnabled`) for fast testing.
- [x] Integrate Liquibase baseline migration framework (`db.changelog-master.yaml` + baseline changeset).
- [ ] Write and test migration/backfill scripts on staging snapshot.
- [ ] Seed `Legacy Conference` and map existing tracks/articles.
- [x] Seed a demo conference dataset for local testing (`AI Summit 2026`, tracks/topics/users/articles/reviews).
- [ ] Produce backfill verification report (counts + referential integrity).
- [ ] Add metrics/dashboard panels:
  - deadline-blocked submissions,
  - review-threshold progress,
  - chair decision notifications.
- [ ] Rehearse rollback playbook in staging.

### Exit Criteria
- Safe toggled rollout with verified rollback path.

---

## Phase G — End-to-End Validation and Sign-off

### Goal
Validate complete business flow and sign off for production rollout.

### TODOs
- [ ] E2E test scenario: submit -> invite -> accept -> structured reviews -> threshold reached -> chair decision.
- [ ] Validate revision loop behavior and versioned attachment history.
- [ ] Validate RBAC for admin/chair/editor/reviewer/author scopes.
- [ ] Validate notification/email behavior for all key events.
- [ ] Validate API compatibility window for legacy clients.
- [ ] Collect sign-off from product + engineering + operations.

### Exit Criteria
- All critical paths pass with no P0/P1 defects.

---

## Tracking Convention
- Use this checklist as the implementation tracker.
- Mark TODOs as complete in this file as work lands.
- For each completed TODO, add a short note in `doc_assets/logs/` with date and impacted files.
