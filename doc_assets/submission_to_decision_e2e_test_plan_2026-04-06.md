# Submission → Decision E2E Test Plan (with Cases)

_Last updated: 2026-04-06_

## 1) Goal
Validate the full conference workflow in production-like order:

- submit
- approve to review
- contact reviewers
- comments + structured reviews
- optional additional reviewer invite
- send conclusion (accept/reject/revisions)
- modification loop (if needed)
- re-review
- final approve/reject

This plan is role-aware and includes happy path + edge cases.

---

## 2) Scope
Covers:
- RBAC behavior for `ADMIN`, `USER` + conference memberships (`RESEARCHER`, `EDITOR`, `REVIEWER`)
- Article status transitions
- Reviewer invitation acceptance flow
- Thread comments + structured review submission
- Review-threshold gate before editor conclusion
- Revision loop and re-entry to review
- Notification and history integrity checks

Out of scope:
- Performance/load testing
- Email template wording quality
- Cross-browser visual QA (except basic smoke)

---

## 3) Preconditions
1. Backend and frontend are running.
2. At least 1 active conference exists with:
   - active track
   - submission deadline in future
   - `minimumCompletedReviews` configured (default `3`)
3. Test users exist:
   - `editor1` (conference EDITOR membership)
   - `researcher1` (conference RESEARCHER membership)
   - `reviewer1`, `reviewer2`, `reviewer3` (conference REVIEWER membership)
   - `reviewer4` (for optional additional reviewer case)
4. Notification channels are reachable (email sink or test mailbox + in-app notifications).
5. Clean seed baseline (or dedicated test conference) to avoid status contamination.

---

## 4) Canonical status path
Primary path:
`SUBMITTED -> PENDING_REVIEW -> IN_REVIEW -> REVIEWS_COMPLETED -> ACCEPTED`

Revision loop path:
`REVIEWS_COMPLETED -> REVISIONS_REQUESTED -> REVISIONS -> IN_REVIEW -> REVIEWS_COMPLETED -> ACCEPTED|REJECTED`

---

## 5) Main scenario (happy path)
## Scenario H1 — Accept without revisions
1. Researcher submits article (`SUBMITTED`).
2. Editor performs initial review and continues to reviewer invitation (`PENDING_REVIEW`).
3. Editor contacts 3 reviewers.
4. At least one reviewer accepts; article moves to `IN_REVIEW`.
5. Reviewers add comments/threads.
6. All 3 reviewers submit structured reviews.
7. System reaches threshold and moves to `REVIEWS_COMPLETED`.
8. Editor sends conclusion: approve.
9. Article becomes `ACCEPTED` and notifications are sent.

Expected:
- No step bypasses RBAC.
- No conclusion action is allowed before `REVIEWS_COMPLETED`.
- Reviewer submissions are counted only when structured review is final-submitted.

---

## 6) Detailed test cases
Use IDs for tracking in bug reports (`WF-XX`).

## A) Submission and initial screening

### WF-01 Submit article success
- Actor: Researcher
- Pre: conference active, before deadline, valid track/topics
- Steps: Submit article with required metadata and file/link
- Expected:
  - HTTP success
  - article created as `SUBMITTED`
  - author list persisted
  - submission notification generated

### WF-02 Submit blocked after deadline
- Actor: Researcher
- Pre: conference deadline passed
- Steps: Submit same payload
- Expected:
  - request rejected (validation/business error)
  - no article created

### WF-03 Initial screening continue-to-review
- Actor: Editor
- Pre: article in `SUBMITTED`
- Steps: perform initial review with “continue/contact reviewers”
- Expected: status -> `PENDING_REVIEW`

### WF-04 Initial screening reject
- Actor: Editor
- Pre: article in `SUBMITTED`
- Steps: reject with reason
- Expected:
  - status -> `REJECTED`
  - reason stored
  - rejection notification sent

### WF-05 Unauthorized initial review
- Actor: Researcher/Reviewer
- Pre: article in `SUBMITTED`
- Steps: call/trigger initial review action
- Expected:
  - access denied
  - no status change

## B) Reviewer invitation & acceptance

### WF-06 Contact reviewers success
- Actor: Editor
- Pre: article in `PENDING_REVIEW`
- Steps: contact reviewer1/2/3
- Expected:
  - reviewer assignments created
  - invitation notifications/emails sent
  - status remains `PENDING_REVIEW` until acceptance

### WF-07 Reviewer accepts invitation
- Actor: Reviewer1
- Pre: invitation pending
- Steps: accept invite
- Expected:
  - invitation status accepted
  - article status -> `IN_REVIEW` (if first acceptance)

### WF-08 Reviewer declines invitation
- Actor: Reviewer2
- Pre: invitation pending
- Steps: decline invite
- Expected:
  - invitation marked declined
  - article remains `PENDING_REVIEW` or `IN_REVIEW` depending on other acceptances

### WF-09 Invite duplicate reviewer email
- Actor: Editor
- Pre: reviewer already invited/assigned
- Steps: invite same email again
- Expected:
  - dedup behavior applied (no duplicate active assignment)
  - no broken state

## C) Comments and structured review

### WF-10 Reviewer comment thread + author reply
- Actors: Reviewer, Researcher
- Pre: article `IN_REVIEW`, reviewer accepted
- Steps:
  - reviewer creates thread/comment
  - author replies
- Expected:
  - thread visible per visibility rules
  - reply linked correctly
  - notifications generated

### WF-11 Structured review draft save
- Actor: Reviewer
- Pre: article `IN_REVIEW`
- Steps: save draft structured review (not final)
- Expected:
  - draft stored
  - completion counter unchanged

### WF-12 Structured review final submit
- Actor: Reviewer
- Pre: draft or empty review exists
- Steps: final submit with scores + recommendation + summary
- Expected:
  - submitted timestamp set
  - completion counter increments by 1
  - recommendation included in aggregate

### WF-13 Prevent unauthorized structured review
- Actor: non-assigned reviewer/user
- Pre: article `IN_REVIEW`
- Steps: submit structured review
- Expected:
  - access denied
  - no review saved

### WF-14 Prevent duplicate final submit mutation
- Actor: assigned reviewer
- Pre: already final-submitted
- Steps: submit final again
- Expected:
  - blocked or controlled overwrite policy enforced
  - no double-count

## D) Threshold and conclusion

### WF-15 Threshold gate to `REVIEWS_COMPLETED`
- Actor: system transition
- Pre: `minimumCompletedReviews = 3`
- Steps: complete final structured reviews for 3 assigned reviewers
- Expected:
  - status -> `REVIEWS_COMPLETED`
  - aggregate stats available

### WF-16 Conclusion blocked before threshold
- Actor: Editor
- Pre: `IN_REVIEW`, completed reviews < threshold
- Steps: try approve/reject/revisions request
- Expected:
  - blocked
  - status unchanged

### WF-17 Send conclusion approve
- Actor: Editor
- Pre: `REVIEWS_COMPLETED`
- Steps: approve
- Expected:
  - status -> `ACCEPTED`
  - conclusion notification sent

### WF-18 Send conclusion reject
- Actor: Editor
- Pre: `REVIEWS_COMPLETED`
- Steps: reject
- Expected:
  - status -> `REJECTED`
  - conclusion notification sent

## E) Optional additional reviewer

### WF-19 Invite additional reviewer during `IN_REVIEW`
- Actor: Editor
- Pre: `IN_REVIEW`, reviewer4 available
- Steps: invite reviewer4 and accept
- Expected:
  - assignment added without corrupting existing reviews
  - threshold logic remains consistent

### WF-20 Additional reviewer submitted after threshold reached
- Actor: Reviewer4
- Pre: article already `REVIEWS_COMPLETED`
- Steps: submit structured review
- Expected:
  - behavior follows policy (either allowed as extra signal or blocked)
  - no invalid status rollback

## F) Revision loop (modification if needed)

### WF-21 Request revisions from completed state
- Actor: Editor
- Pre: `REVIEWS_COMPLETED`
- Steps: send revisions-required conclusion
- Expected: status -> `REVISIONS_REQUESTED`

### WF-22 Researcher starts modifications
- Actor: Researcher
- Pre: `REVISIONS_REQUESTED`
- Steps: start revision
- Expected: status -> `REVISIONS`

### WF-23 Submit revision file/version
- Actor: Researcher
- Pre: `REVISIONS` (or allowed from `REVISIONS_REQUESTED`)
- Steps: upload revised manuscript
- Expected:
  - new version stored
  - status -> `IN_REVIEW`
  - review round reset behavior follows policy

### WF-24 Re-review and final conclusion
- Actors: Reviewer(s), Editor
- Pre: article back in `IN_REVIEW`
- Steps:
  - reviewers submit structured reviews for new round
  - threshold reached
  - editor sends final approve/reject
- Expected:
  - clean second-cycle transition
  - final status terminal (`ACCEPTED`/`REJECTED`)

## G) RBAC/security regression

### WF-25 Researcher cannot send conclusion
- Actor: Researcher
- Steps: invoke approve/reject endpoint/UI
- Expected: denied

### WF-26 Reviewer cannot manage reviewer invites
- Actor: Reviewer
- Steps: invoke contact reviewers
- Expected: denied

### WF-27 Editor outside conference scope cannot act
- Actor: Editor without membership in target conference
- Steps: initial review / contact / conclusion
- Expected: denied

---

## 7) Data integrity checks per run
After each major stage, verify:
1. Status is exactly expected.
2. Reviewer assignment states are consistent.
3. Structured review counts match threshold logic.
4. Notifications emitted once per event (no duplicates).
5. Revision versions are append-only; previous versions remain accessible.

---

## 8) Pass criteria
A release is workflow-ready when:
- All `WF-01`..`WF-27` pass.
- No unauthorized action changes state.
- No illegal transition is possible through UI or API.
- No threshold bypass is possible.
- Revision loop works for at least one full second cycle.

---

## 9) Execution checklist (quick run)
- [ ] Execute happy path `H1`
- [ ] Execute threshold negative `WF-16`
- [ ] Execute optional reviewer `WF-19`
- [ ] Execute revision loop `WF-21`..`WF-24`
- [ ] Execute RBAC block checks `WF-25`..`WF-27`
- [ ] Record API logs, notifications, and final status timeline

---

## 10) Suggested evidence to attach per test run
- Article status timeline screenshots
- Reviewer invitation/acceptance evidence
- Structured review payload/result evidence
- Notification log/email snapshots
- Version history after revision
- Final conclusion proof with status + message
