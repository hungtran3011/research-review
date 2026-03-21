# Conference-centered flow rewrite

Date: 2026-03-06

## Summary

Updated the product flow documentation to move from a global-track model to a conference-centered model similar to EasyChair.

## Main changes

- Introduced `conference` as the top-level publishing unit.
- Clarified that each conference owns its own `tracks`.
- Added `topic` configuration under conference/track scope.
- Added `submissionDeadline` as a required conference setting.
- Updated submission flow so authors must choose conference, track, and topic(s).
- Updated review flow so reviewer recommendations do not directly become final decisions.
- Added threshold-based peer review completion:
  - each conference/track can define `minimumCompletedReviews`
  - default is `3`
  - when threshold is reached, notify the chair
  - only the chair sends the formal decision to authors
- Updated RBAC notes to include `Chair` responsibilities and conference-scoped permissions.

## Files updated

- `doc_assets/flow.md`
- `doc_assets/rbac_admin_requirements.md`
- `doc_assets/review_flow_end_to_end.md`

## Notes

This is a documentation and workflow rewrite only. No backend/frontend implementation was changed in this update.
