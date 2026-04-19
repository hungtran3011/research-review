# ADR: Introduce Central Conference Authorization Service

Date: 2026-04-05
Status: Accepted (Phase 0 foundation)

## Context

The current authorization model mixes global roles and conference-scoped concerns across controller annotations and service-level checks. This makes the migration to:

- global roles: `ADMIN`, `USER`
- conference roles: `RESEARCHER`, `EDITOR`, `REVIEWER`

hard to execute safely and consistently.

## Decision

Introduce a central backend service named `ConferenceAuthorizationService` to encapsulate conference-scoped authorization checks.

Phase 0 scope:

1. Add the service contract and implementation as a non-breaking foundation.
2. Add action-oriented APIs:
   - `canSubmit(conferenceId, userId?)`
   - `canManageReview(articleId, userId?)`
   - `canFinalizeDecision(articleId, userId?)`
   - `canSubmitStructuredReview(articleId, userId?)`
3. Add `require*` helpers that:
   - call the corresponding `can*`
   - log denied authorization with context (`userId`, `endpoint`, `conferenceId`/`articleId`, `action`)
   - throw `AccessDeniedException`
4. Add unit tests for a baseline permission matrix.

No runtime behavior changes are introduced in Phase 0. Existing controllers/services are not yet rewired.

## Rationale

- Gives a single, testable place for conference authorization logic.
- Decouples conference permissions from JWT global claims.
- Supports incremental migration from global role checks to conference-scoped checks without risky big-bang refactors.

## Consequences

### Positive

- Reduced duplication and drift in authorization decisions.
- Cleaner migration path for Phase 1+.
- Better observability for denied actions.

### Negative

- Temporary overlap with legacy authorization code until later phases complete.
- Requires disciplined adoption in follow-up phases.

## Follow-up

- Phase 1+: replace direct global role checks in article/review workflows with this service.
- Phase 2+: convert controller annotations for conference-scoped actions to `isAuthenticated()` + service-level checks.
