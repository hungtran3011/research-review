# Prefill submitter as first author (2026-01-07)

## Change summary

- The submit article form now auto-fills the first author with the currently authenticated user (submitter).
- This reduces manual data entry and ensures the submitter is listed as author #1 by default.

## Behavior

- On page load (after fetching `/users/me`), if the first author row is still blank, it is prefilled with:
  - `name`
  - `email`
  - `institutionId` (if the user has an institution)
- If the user has already typed into the first author row, the auto-fill does not overwrite their input.

## Files changed

- frontend/src/components/article/SubmitArticle.tsx
