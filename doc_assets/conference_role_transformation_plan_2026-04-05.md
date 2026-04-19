# Conference-Scoped RBAC Transformation Plan

_Last updated: 2026-04-05_

## Execution Status (2026-04-05)

- Phase 0 foundation completed: centralized `ConferenceAuthorizationService` + test coverage.
- Legacy role model removed from backend domain: `User.role` and `UserRole` are no longer used.
- Backend authorization and token authority generation now use `globalRole` + conference memberships.
- Backend `UserDto` compatibility fields (`role`, `roles`) removed; contract uses `globalRole`.
- Frontend contract aligned to `globalRole` and conference membership roles (`RESEARCHER`, `EDITOR`, `REVIEWER`).
- Current validation status: backend compile and focused auth tests pass; frontend TypeScript build passes.

## 1) Goal

Migrate authorization from mixed global roles (`ADMIN`, `USER`, `RESEARCHER`, `EDITOR`, `REVIEWER`, `CHAIR`) to:

- **Global roles only:** `ADMIN`, `USER`
- **Conference-scoped roles:** `RESEARCHER`, `EDITOR`, `REVIEWER` (per conference)

This plan intentionally preserves behavior during transition, then removes legacy global role dependencies.

---

## 2) Current-State Findings (from codebase scan)

### Backend

- Global roles still drive method security in multiple controllers:
  - `ArticleController` uses `@PreAuthorize("hasRole('RESEARCHER'|'EDITOR'|'CHAIR'...)")`
  - `StructuredReviewController` and `ReviewerInviteController` use global `REVIEWER`/`CHAIR` checks
  - `UserController` uses global `ADMIN`/`EDITOR`
- JWT authorities are mapped from `roles` claim (`SecurityConfig.jwtAuthenticationConverter`), so authorization depends on global role claims.
- `User` currently stores both:
  - legacy single `role: Role`
  - multi-role `roles: Set<UserRole>`
- `Role` enum still contains conference-scoped values.
- `ConferenceMembershipRole` exists but currently is `{ CHAIR, EDITOR, PARTICIPANT }`, not aligned with target roles.
- `UserConferenceMembership` exists and is used in parts of article access logic (`ArticleAccessGuardImpl`) and admin config flows.
- Service layer still mutates/assumes global roles in several places (`UsersServiceImpl`, `ArticlesServiceImpl`).

### Frontend

- Route and component gating depend on global role arrays (`ProtectedRoute`, `main.tsx`, `Nav`, `ArticleWorkspace`, `ArticleDetails`, `Profile`, admin pages).
- `Role` constants still include `EDITOR`, `RESEARCHER`, `REVIEWER` globally.
- User APIs and models still emphasize global role updates (`/users/{id}/role`, `UserRoleUpdateRequestDto`).
- Conference membership APIs already exist under admin configuration and are partially integrated.

### Data / Schema

- Liquibase is enabled, but baseline is minimal and schema evolution is still effectively from JPA (`ddl-auto=update`).
- Existing data likely has mixed semantics between global role columns and membership rows.

---

## 3) Target Authorization Model

## 3.1 Role model

- `GlobalRole`: `ADMIN`, `USER`
- `ConferenceRole`: `RESEARCHER`, `EDITOR`, `REVIEWER`

A user can hold different conference roles across conferences. No global `RESEARCHER/EDITOR/REVIEWER/CHAIR`.

## 3.2 Authority rules

- **Global ADMIN**: full cross-conference access.
- **Conference RESEARCHER**: submit/manage own submissions in that conference.
- **Conference EDITOR**: manage review workflow inside assigned conference scope.
- **Conference REVIEWER**: review only invited articles; invitation must belong to conference where user has reviewer membership (or auto-provision reviewer membership on invite acceptance).
- **Global USER only**: authenticated baseline user without elevated conference privileges.

## 3.3 Enforcement strategy

- Keep `@PreAuthorize` for global-only checks (`ADMIN`, `isAuthenticated`).
- Move conference-role checks into a dedicated authorization service / permission evaluator using:
  - `conferenceId`
  - current user id
  - membership table
  - optional ownership/reviewer-link checks

This avoids encoding conference context into JWT claims and keeps authorization DB-driven.

---

## 4) Detailed Execution Plan (Phased)

## Phase 0 — Safety Net & Architecture Prep (1–2 days)

### Deliverables

1. Add ADR/decision note for RBAC model and migration strategy.
2. Create central authorization service:
   - `ConferenceAuthorizationService` (or `ConferencePermissionEvaluator`)
   - APIs like:
     - `canSubmit(conferenceId, userId)`
     - `canManageReview(articleId, userId)`
     - `canFinalizeDecision(articleId, userId)`
     - `canSubmitStructuredReview(articleId, userId)`
3. Add telemetry/logging for denied access (include userId, endpoint, conferenceId/articleId).

### Acceptance criteria

- No behavior changes yet.
- New auth service compiles and has unit tests for matrix of roles/actions.

---

## Phase 1 — Domain & Enum Refactor (2–3 days)

### Backend changes

1. Split enums:
   - Replace current `Role` usage with:
     - `GlobalRole` (ADMIN, USER)
     - `ConferenceMembershipRole` updated to (RESEARCHER, EDITOR, REVIEWER)
2. Update `User` entity:
   - Deprecate/remove legacy fields (`role`, `roles`) in stages.
   - Introduce explicit global role storage (`globalRole` single enum, default USER) or dedicated `user_global_roles` table (choose one; simplest is single enum).
3. Update DTOs:
   - `UserDto.role/roles` -> `globalRole` plus `conferences[]` membership roles.
   - Keep temporary compatibility fields during transition window.

### Data migration

Create Liquibase change sets to:

1. Add new global role column/table.
2. Backfill global role:
   - users with ADMIN => global ADMIN
   - all others => global USER
3. Backfill conference memberships from legacy role data where needed:
   - legacy RESEARCHER/EDITOR/REVIEWER/CHAIR mapped to conference roles based on existing conference/track/editor/reviewer/article links
4. Add constraints:
   - unique `(user_id, conference_id)`
   - non-null membership role
5. Keep old columns/tables for compatibility (do not drop yet).

### Acceptance criteria

- Application boots with migrated schema.
- Existing users have deterministic global role + conference memberships.

---

## Phase 2 — Service-Layer Authorization Rewrite (3–5 days)

### Backend changes

1. Replace global role checks in services:
   - `ArticlesServiceImpl`:
     - replace `hasRole(RESEARCHER/EDITOR/REVIEWER/CHAIR)` with conference authorization service checks
     - `ensureUserHasRole(user, REVIEWER)` replaced with membership assignment in conference
   - `StructuredReviewServiceImpl` and invite decision flow:
     - enforce conference reviewer membership + reviewer assignment status
2. Update `ArticleAccessGuardImpl`:
   - remove global role branching for conference roles
   - treat ADMIN as global bypass only
   - all non-admin checks based on conference memberships + ownership + reviewer links
3. Update `UsersServiceImpl`:
   - remove role-assignment business logic for conference roles
   - role update endpoint handles global role only (`ADMIN`/`USER`)
   - conference role assignment delegated to conference membership APIs

### Acceptance criteria

- Service logic no longer depends on global conference roles.
- Unit/integration tests for article lifecycle pass using conference memberships only.

---

## Phase 3 — Controller & Endpoint Contract Migration (2–4 days)

### Backend endpoint strategy

1. Replace `@PreAuthorize("hasRole('RESEARCHER'|'EDITOR'|'REVIEWER'|'CHAIR')")` with:
   - `@PreAuthorize("isAuthenticated()")` for conference-scoped endpoints
   - enforce conference-specific permission inside service layer
2. Keep `@PreAuthorize("hasRole('ADMIN')")` only for admin/global management endpoints.
3. Update admin APIs:
   - `/users/{id}/role` => global role only
   - conference role assignment strictly via `/admin/configuration/conferences/{conferenceId}/members`
4. Add dedicated membership queries for UI:
   - `GET /users/me/memberships`
   - optional `GET /conferences/{id}/me/permissions` for efficient frontend gating

### JWT/security config

- JWT `roles` claim should only include global roles.
- Remove assumptions that first role claim determines business authority (`extractRole` pattern).

### Acceptance criteria

- All conference-scoped endpoints pass with `isAuthenticated` + service-level checks.
- No endpoint requires global `RESEARCHER/EDITOR/REVIEWER/CHAIR` claim.

---

## Phase 4 — Frontend Authorization & UX Refactor (3–5 days)

### Frontend changes

1. Role model updates:
   - `Role` constants -> `GlobalRole` (`ADMIN`, `USER`)
   - use `ConferenceMembershipRole` for conference-scoped actions
2. Replace `ProtectedRoute allowedRoles=[...]` usage for conference actions:
   - route-level guard should check authentication only
   - page-level capability derived from current conference membership + API-provided permissions
3. Update screens/components:
   - `Nav`, `ArticleWorkspace`, `ArticleDetails`, `Profile`, reviewer invite/structured review flows
   - remove assumptions like `currentUser.role === 'REVIEWER'`
4. Update admin user management:
   - global role editor limited to ADMIN/USER
   - conference role management moved to conference member management UI
5. API models:
   - remove or deprecate frontend models for global conference-role updates
   - consume memberships from `UserDto.conferences` or dedicated endpoint

### Acceptance criteria

- UI behavior is correct when a user is editor in conference A and reviewer in conference B.
- No frontend gating depends on global `EDITOR/RESEARCHER/REVIEWER/CHAIR`.

---

## Phase 5 — Hard Cutover & Cleanup (2–3 days)

### Backend cleanup

1. Remove deprecated enum values and legacy checks.
2. Remove `user.role`/`user.roles` compatibility mapping for conference roles.
3. Remove dead messages and validations tied to legacy roles:
   - e.g., `trackRequiredForEditor`, self-registration restrictions for editor role, etc.
4. Remove any fallback code that reads legacy role claims.

### DB cleanup

1. Liquibase change set to drop deprecated columns/tables/indexes after successful soak period.
2. Keep rollback script to restore previous columns if emergency rollback needed.

### Acceptance criteria

- Build/test green with only global ADMIN/USER + conference memberships.
- No references to legacy global conference roles remain.

---

## 5) Endpoint-by-Endpoint Migration Checklist

## A. Article and review workflow APIs

- `POST/PUT/DELETE /api/v1/articles` (researcher actions)
- `POST /api/v1/articles/{id}/initial-review`
- `POST /api/v1/articles/{id}/reviewers`
- `POST /api/v1/articles/{id}/reviews/completed`
- `POST /api/v1/articles/{id}/decision/*`
- `POST /api/v1/articles/{id}/reviewers/contact`
- `POST /api/v1/articles/{id}/revisions*`
- `POST/GET /api/v1/articles/{id}/structured-reviews*`
- `POST /api/v1/reviewer-invites/accept|decline`

Action: replace global preauthorize role checks with service-layer conference permissions.

## B. User/admin APIs

- `/api/v1/users*` and `/api/v1/admin/configuration/users*`

Action:
- Global role update only ADMIN/USER
- Conference roles managed only via conference membership APIs.

## C. Security config

- JWT authority converter and claim expectations

Action:
- treat claim roles as global only; conference auth from DB.

---

## 6) Data Migration Mapping Rules (Explicit)

For each user:

1. **Global role mapping**
   - If user has legacy ADMIN anywhere -> `globalRole = ADMIN`
   - Else -> `globalRole = USER`

2. **Conference membership mapping**
   - Existing `user_conference_membership` rows retained and normalized to new role set.
   - Legacy chair/editor artifacts:
     - track editor assignment -> conference `EDITOR`
     - legacy chair role (if represented) -> map to conference `EDITOR` unless a separate chair policy is introduced
   - Legacy reviewer links:
     - user with reviewer assignments/invitations in conference -> ensure `REVIEWER` membership for that conference
   - Legacy researcher participation:
     - article author/creator in conference -> ensure `RESEARCHER` membership

3. **Conflict resolution**
   - If multiple derived roles for same user+conference:
     - Store highest-privilege role if single-role membership design is kept (`EDITOR` > `REVIEWER` > `RESEARCHER`), or
     - Prefer multi-role-per-conference table (recommended long-term).

> Decision needed: current table supports one role per conference membership row. If users can be both reviewer and researcher in one conference, move to `(user, conference, role)` table shape.

---

## 7) Testing & Validation Plan

## Backend tests

- Authorization matrix tests (admin, user-without-membership, researcher/editor/reviewer per conference).
- Negative tests for cross-conference access attempts.
- Regression tests for article lifecycle and structured reviews.

## Frontend tests

- Route access smoke tests by user context.
- Page action visibility tests based on memberships.
- Admin flows: global role update vs conference role assignment.

## E2E scenarios (must-pass)

1. User is `EDITOR` in Conf A and `REVIEWER` in Conf B.
2. User submits article in Conf A as researcher, cannot manage reviewers unless editor there.
3. Reviewer can accept invite and submit review only for invited article conference.
4. Admin can manage all conferences regardless of membership.
5. Plain USER with no membership cannot perform conference-scoped actions.

---

## 8) Rollout Strategy

1. **Release 1 (compatibility)**
   - Introduce new model + dual-read logic.
   - Continue writing legacy + new paths where required.
2. **Release 2 (switch)**
   - Turn on conference-membership-only authorization.
   - Keep monitoring and fallback flags.
3. **Release 3 (cleanup)**
   - Remove legacy fields/checks and finalize schema.

Feature flags recommended:

- `rbac.useConferenceAuthorization`
- `rbac.writeLegacyRoleFields`

---

## 9) Risks and Mitigations

- **Risk:** breaking access for existing users after migration.
  - **Mitigation:** deterministic backfill + dry-run script + audit report before cutover.
- **Risk:** JWT claims out-of-sync with DB memberships.
  - **Mitigation:** conference permissions always DB-evaluated.
- **Risk:** single membership role cannot represent mixed responsibilities.
  - **Mitigation:** decide now whether to support multi-role memberships; if yes, update schema first.
- **Risk:** frontend assumes one global role for navigation.
  - **Mitigation:** switch to conference-context-aware capability hooks.

---

## 10) Recommended Implementation Order (concrete)

1. Add `GlobalRole` + adjust `ConferenceMembershipRole`.
2. Introduce `ConferenceAuthorizationService` and tests.
3. Migrate `ArticleAccessGuardImpl` + article/structured-review services.
4. Migrate controller annotations to `isAuthenticated` for conference-scoped endpoints.
5. Update frontend role constants, protected route strategy, and article screens.
6. Run backfill + validate with E2E matrix.
7. Remove legacy role code and schema.

---

## 11) Open Decisions to Confirm Before Coding

1. Should conference memberships support multiple roles per user per conference?
   - **Recommended:** yes (future-safe), via membership-role join table.
2. Should legacy `CHAIR` semantics be merged into `EDITOR` now, or keep separate conference role?
   - Current requirement says conference roles are researcher/editor/reviewer only.
3. Should `/users/me` continue returning compatibility fields (`role`, `roles`) for one release?
   - **Recommended:** yes, with deprecation notice.

---

## 12) Definition of Done

- Only global roles in auth claims and global admin checks: `ADMIN`, `USER`.
- All conference actions authorized by conference membership + domain relationships.
- Frontend no longer branches on global `EDITOR/RESEARCHER/REVIEWER/CHAIR`.
- Legacy role fields and checks removed after successful soak.
- Regression + E2E matrix fully green.
