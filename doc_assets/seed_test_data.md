# Seed Test Data Quickstart

_Last updated: 2026-03-21_

## Enable seed data

Seed data is controlled by feature flag:

- `feature.demo-seed-enabled=true`

Already enabled in:

- `backend/src/main/resources/application-local.properties`

Default in shared config remains disabled:

- `backend/src/main/resources/application.properties` -> `false`

## Run locally with seed data

Use Spring local profile so local flags apply:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

## What gets seeded

### Conference / Track / Topic

- Conference: `AI Summit 2026` (`LEGACY-2026`)
- Tracks:
  - `Natural Language Processing`
  - `Information Retrieval`
- Topics:
  - `LLM Evaluation`
  - `Peer Review Automation`
  - `Search Ranking`

### Users

- `seed.admin@demo.local` (ADMIN)
- `seed.chair@demo.local` (CHAIR)
- `seed.editor@demo.local` (EDITOR)
- `seed.researcher@demo.local` (RESEARCHER)
- `seed.reviewer1@demo.local` (REVIEWER)
- `seed.reviewer2@demo.local` (REVIEWER)
- `seed.reviewer3@demo.local` (REVIEWER)

### Workflow data

- One article in `IN_REVIEW` with:
  - author linkage
  - topic linkage
  - 3 assigned reviewers (accepted)
  - 2 submitted structured reviews (for threshold-progress testing)
  - sample comment thread + author reply
- One article in `REVIEWS_COMPLETED` with:
  - 3 submitted structured reviews (for chair-decision testing)

## Notes

- Seeding is idempotent by conference short name (`LEGACY-2026`): if it exists, seeder exits.
- To reseed from scratch, clear the local database and run again.
