# Reviewer invite token (2025-12-27)

## Summary

- Implemented secure reviewer invitation links using opaque random tokens (no email in URL).

## Backend

- Added `ReviewerInvite` persistence with hashed token, expiry (7 days), and single-use semantics.
- Added public endpoint `GET /api/v1/reviewer-invites/resolve?token=...` to resolve invite token to `{ email, articleId }`.
- Updated reviewer contact flow to generate unique invite token per reviewer and include `/reviewer-invite?token=...` in the email.
- Updated user self-registration (`POST /api/v1/users/complete-info`) to accept optional `inviteToken` and force `role = REVIEWER` + invited email, then link the created `User` to the existing `Reviewer` record (by email).

## Frontend

- Added `/reviewer-invite` route to resolve token, store `inviteToken` in auth state, and redirect to existing `/signup` flow.
- Prefilled the signup email when present in auth state.
- Attached `inviteToken` in the `/info` profile completion payload.
