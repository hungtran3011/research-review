## Plan: Conference Workflow Transition (DRAFT)

Based on your chosen direction: explicit conference membership, hard cutover (no track-only compatibility), and adding a CHAIR role now. The transition should move in dependency order so we avoid broken intermediate states: first authority model and schema foundations, then submission contract/deadline enforcement, then reviewer invitation context, then structured review + threshold gating, and finally cleanup of legacy paths. This plan focuses on the areas you requested: conference registration, submission/deadline, initial review, contacting reviewers, and the new peer-review strategy.

**Steps**
1. **Role and access foundation**
   - Add CHAIR role in [backend/src/main/kotlin/com/example/researchreview/constants/Role.kt](backend/src/main/kotlin/com/example/researchreview/constants/Role.kt).
   - Update authorization entry points in [backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt](backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt), [backend/src/main/kotlin/com/example/researchreview/controllers/AdminConfigurationController.kt](backend/src/main/kotlin/com/example/researchreview/controllers/AdminConfigurationController.kt), and article scope checks in [backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleAccessGuardImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ArticleAccessGuardImpl.kt).
   - Introduce conference-scoped authority model (chair assignment + editor delegation) via new mapping entities/repositories under [backend/src/main/kotlin/com/example/researchreview/entities](backend/src/main/kotlin/com/example/researchreview/entities).

2. **Conference registration model for users**
   - Add explicit User–Conference membership entity and repo (for registration/join semantics) under [backend/src/main/kotlin/com/example/researchreview/entities](backend/src/main/kotlin/com/example/researchreview/entities) and [backend/src/main/kotlin/com/example/researchreview/repositories](backend/src/main/kotlin/com/example/researchreview/repositories).
   - Add admin/chair membership management APIs in [backend/src/main/kotlin/com/example/researchreview/controllers/AdminConfigurationController.kt](backend/src/main/kotlin/com/example/researchreview/controllers/AdminConfigurationController.kt).
   - Extend user DTOs in [backend/src/main/kotlin/com/example/researchreview/dtos](backend/src/main/kotlin/com/example/researchreview/dtos) and service methods in [backend/src/main/kotlin/com/example/researchreview/services/UsersService.kt](backend/src/main/kotlin/com/example/researchreview/services/UsersService.kt), [backend/src/main/kotlin/com/example/researchreview/services/impl/UsersServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/UsersServiceImpl.kt).

3. **Submission contract hard cutover**
   - Replace track-only submission payload in [backend/src/main/kotlin/com/example/researchreview/dtos/ArticleRequestDto.kt](backend/src/main/kotlin/com/example/researchreview/dtos/ArticleRequestDto.kt) with required conferenceId, trackId, topicIds.
   - Expand article domain in [backend/src/main/kotlin/com/example/researchreview/entities/Article.kt](backend/src/main/kotlin/com/example/researchreview/entities/Article.kt) to include conference relation and add article-topic link entity/repo.
   - Update creation/update flow in [backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt) and controller contracts in [backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt](backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt).
   - Remove acceptance of legacy track-only submit payloads (per hard cutover decision).

4. **Deadline and taxonomy enforcement**
   - Enforce submission rules in service layer: conference active, track belongs to conference, topic belongs to selected track/conference, now <= submissionDeadline from [backend/src/main/kotlin/com/example/researchreview/entities/Conference.kt](backend/src/main/kotlin/com/example/researchreview/entities/Conference.kt).
   - Add validation/business exceptions using [backend/src/main/kotlin/com/example/researchreview/exceptions](backend/src/main/kotlin/com/example/researchreview/exceptions) and global handling in [backend/src/main/kotlin/com/example/researchreview/exceptions/ExceptionController.kt](backend/src/main/kotlin/com/example/researchreview/exceptions/ExceptionController.kt).

5. **Initial review and decision authority rewrite**
   - Keep initial screening flow but authorize CHAIR and delegated EDITOR in [backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt](backend/src/main/kotlin/com/example/researchreview/controllers/ArticleController.kt).
   - Remove reviewer-requested-decision statuses and align transitions to chair-only final decisions in [backend/src/main/kotlin/com/example/researchreview/constants/ArticleStatus.kt](backend/src/main/kotlin/com/example/researchreview/constants/ArticleStatus.kt) and [backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt).

6. **Reviewer contact flow with conference context**
   - Keep invitation mechanics in [backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerServiceImpl.kt), [backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerInviteServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerInviteServiceImpl.kt), [backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerInviteDecisionServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ReviewerInviteDecisionServiceImpl.kt).
   - Extend invite/request DTOs to include conference/track/topic context for reviewer clarity.
   - Ensure invitation acceptance remains the only trigger for PENDING_REVIEW → IN_REVIEW.

7. **Structured review subsystem (new peer review strategy)**
   - Add structured-review domain: review round, criterion scores, summary notes, confidential remarks, recommendation enum.
   - Add APIs for draft/save/submit structured review and chair/editor anonymized/full views.
   - Ensure completed review count is based only on submitted structured reviews, not comments.

8. **Threshold gate and REVIEWS_COMPLETED transition**
   - Add REVIEWS_COMPLETED state and gate logic in [backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt](backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt): IN_REVIEW → REVIEWS_COMPLETED when completed structured reviews >= policy threshold.
   - Resolve threshold precedence: track override from [backend/src/main/kotlin/com/example/researchreview/entities/Track.kt](backend/src/main/kotlin/com/example/researchreview/entities/Track.kt) else conference default from [backend/src/main/kotlin/com/example/researchreview/entities/Conference.kt](backend/src/main/kotlin/com/example/researchreview/entities/Conference.kt).
   - Trigger chair notification event when threshold is reached.

9. **Frontend alignment for hard cutover**
   - Update submit models/forms and API calls in [frontend/src/models/article-request.model.ts](frontend/src/models/article-request.model.ts), [frontend/src/models/article.model.ts](frontend/src/models/article.model.ts), [frontend/src/components/article/SubmitArticle.tsx](frontend/src/components/article/SubmitArticle.tsx), and related hooks/services under [frontend/src/hooks](frontend/src/hooks), [frontend/src/services](frontend/src/services).
   - Update reviewer review UI to structured-review submission and remove direct accept/reject recommendation actions from review stage.

10. **Legacy cleanup and transition closure**
   - Remove obsolete legacy status paths and endpoints after full migration.
   - Remove old frontend calls to legacy admin track/user paths and keep admin config centralized.
   - Update transition logs/docs in [doc_assets/logs](doc_assets/logs) with rollout notes.

**Verification**
- Backend compile and tests for affected modules.
- API integration checks:
  - user conference membership registration and retrieval,
  - submit rejects when deadline exceeded or conference/track/topic mismatch,
  - reviewer invite accept transitions only to IN_REVIEW,
  - structured review submission increments completion count,
  - threshold transition to REVIEWS_COMPLETED,
  - chair-only final decision notifications.
- Frontend manual checks:
  - submission form requires conference, track, topic(s),
  - deadline warning/disable behavior,
  - reviewer structured review form and submit lock behavior,
  - admin configuration screens for conference tracks/topics/users + memberships.

**Decisions**
- Registration semantics: explicit User–Conference membership.
- Compatibility mode: no legacy track-only submission fallback.
- Authority model: add CHAIR role immediately and enforce chair-only final decision flow.
