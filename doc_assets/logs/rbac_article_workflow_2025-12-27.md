# RBAC + Article Workflow Guards (Submitting / Initial Review / Contact Reviewer) — 2025-12-27

## Summary

Tightened role-based access control and workflow gating for the core article pipeline:

- **Submitting** is restricted to **RESEARCHER**.
- **Initial review** is restricted to **EDITOR**, and only allowed when the article is **SUBMITTED**.
- **Contacting reviewers** is restricted to **EDITOR**, **track-scoped**, and only allowed after initial review when the article is **PENDING_REVIEW**.

## Backend changes

- Added method security guards (`@PreAuthorize`) to article workflow endpoints.
- Added service-level checks for defense-in-depth:
  - Block non-RESEARCHER users from submitting.
  - Block initial review unless article status is `SUBMITTED`.
  - Block contacting reviewers unless article status is `PENDING_REVIEW`, and enforce track scoping via `ArticleAccessGuard`.

## Frontend changes

- Restricted `/articles/submit` route to `RESEARCHER`.
- Hid the “Nộp bài báo” navigation item for non-researchers.

## Notes / Future decision

The reviewer-contact email currently includes the article's `link` (document link). The desired flow expects an app link that redirects the reviewer to sign-up with email pre-filled. This requires a separate approved change to define the invitation URL and frontend handling.
