# Testing Guide (Local) — Research Review

This guide describes:

- How to run the app locally for manual testing
- How to create mock data (tracks, institutions, users, articles, reviewers)
- What flows and test cases to cover (RBAC + workflow + reviewer invite token)

> Notes
> - Backend API base: `http://localhost:8080/api/v1`
> - Frontend dev server: `http://localhost:5173`
> - Local dependencies (Postgres/Redis/Elasticsearch) are started via Docker.

---

## 1) Local setup

### 1.1 Start dependencies (Postgres/Redis/Elasticsearch)

From `backend/`:

```powershell
cd backend
docker compose -f compose.local.yaml up -d
```

To reset to a clean DB state:

```powershell
docker compose -f compose.local.yaml down -v
docker compose -f compose.local.yaml up -d
```

### 1.2 Start a local SMTP inbox (recommended: MailHog)

Because sign-in/sign-up uses email verification, you need an SMTP sink during testing.

Run MailHog:

```powershell
docker run --rm -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

MailHog UI: `http://localhost:8025`

### 1.3 Run backend (local profile)

In a new terminal from `backend/`, set env vars (adjust values if needed):

```powershell
$env:FRONTEND_URL = 'http://localhost:5173'
$env:SPRING_MAIL_HOST = 'localhost'
$env:SPRING_MAIL_PORT = '1025'
$env:SPRING_MAIL_USERNAME = ''
$env:SPRING_MAIL_PASSWORD = ''
$env:SPRING_MAIL_SMTP_AUTH = 'false'
$env:SPRING_MAIL_SMTP_STARTTLS_ENABLE = 'false'

# required app secrets (example values)
$env:REDIS_KEY_SECRET = 'dev-secret-change-me'
$env:JWT_SECRET_KEY = 'dev-jwt-secret-change-me'
$env:JWT_ACCESS_EXPIRATION_MS = '3600000'
$env:JWT_REFRESH_EXPIRATION_MS = '604800000'

# JWT PEM values should be set the same way you configured earlier
# $env:JWT_PUBLIC_PEM_KEY = '-----BEGIN PUBLIC KEY-----...'
# $env:JWT_PRIVATE_PEM_KEY = '-----BEGIN PRIVATE KEY-----...'

.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

Quick smoke test:

- `GET http://localhost:8080/api/v1/test` should return a hello string.

### 1.4 Run frontend

From `frontend/`:

```powershell
cd frontend
yarn
yarn dev
```

---

## 2) Mock data creation

You can create most mock data via API calls.

### 2.1 Create institutions

Endpoint: `POST /institutions` (currently public)

Example:

```powershell
curl -X POST http://localhost:8080/api/v1/institutions \
  -H "Content-Type: application/json" \
  -d '{"name":"HCMUT","country":"VN","website":"https://hcmut.edu.vn"}'
```

Then list institutions (paged):

```powershell
curl "http://localhost:8080/api/v1/institutions?page=0&size=50"
```

Copy an `institutionId` for later.

### 2.2 Create tracks

Endpoint: `POST /tracks` (currently public)

```powershell
curl -X POST http://localhost:8080/api/v1/tracks \
  -H "Content-Type: application/json" \
  -d '{"name":"AI","description":"Artificial Intelligence","isActive":true}'
```

List tracks:

```powershell
curl http://localhost:8080/api/v1/tracks
```

Copy a `trackId`.

### 2.3 Create users (sign-up / sign-in)

The app uses email verification.

#### 2.3.1 Create a normal user via UI

1) Go to `http://localhost:5173/signup`
2) Enter an email (example: `admin@example.com`)
3) Open MailHog `http://localhost:8025` and click the verification link.
4) Complete user info at `/info`.

> Important: `/info` currently defaults the role to `USER` (unless it is a reviewer invite, which forces `REVIEWER`).

#### 2.3.2 Bootstrap an ADMIN (required for role assignment tests)

Self-registration blocks ADMIN/EDITOR creation, so you need to bootstrap the first admin via DB.

Open a psql shell into the local Postgres container:

```powershell
docker compose -f backend/compose.local.yaml exec postgres psql -U test_user -d research
```

Inspect the users table and role column type:

```sql
\d users
select id, email, role from users order by created_at desc;
```

Then update the role for your chosen account:

- If `role` is stored as an integer (common when `@Enumerated` is not set):

```sql
-- Role mapping in backend/constants/Role.kt:
-- ADMIN=0, USER=1, EDITOR=2, RESEARCHER=3, REVIEWER=4
update users set role = 0 where email = 'admin@example.com';
```

- If `role` is stored as text:

```sql
update users set role = 'ADMIN' where email = 'admin@example.com';
```

Now sign in via UI at `/signin` for `admin@example.com` and verify via MailHog.

### 2.4 Promote users to RESEARCHER / EDITOR (admin API)

Endpoint (admin-only): `PATCH /users/{id}/role`

1) Create accounts for:
- Researcher: `researcher@example.com`
- Editor: `editor@example.com`

2) As ADMIN, fetch users list:

```powershell
curl -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" "http://localhost:8080/api/v1/users?page=0&size=50"
```

3) Promote roles:

```powershell
curl -X PATCH http://localhost:8080/api/v1/users/<USER_ID>/role \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"RESEARCHER"}'

curl -X PATCH http://localhost:8080/api/v1/users/<USER_ID>/role \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"EDITOR"}'
```

> Getting `<ADMIN_ACCESS_TOKEN>`
> - The UI stores the access token after a successful sign-in verify.
> - Alternatively, use the `/api/v1/auth/verify` response for sign-in, which can return `accessToken`/`refreshToken`.

### 2.5 Attach an EDITOR to a Track (editor mapping)

The editor’s track scope uses the Editor mapping.

Endpoint: `POST /editors/` (requires authentication)

```powershell
curl -X POST http://localhost:8080/api/v1/editors/ \
  -H "Authorization: Bearer <EDITOR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"trackId":"<TRACK_ID>","userId":"<EDITOR_USER_ID>"}'
```

---

## 3) Flow testing (happy paths)

### 3.1 Submit article (RESEARCHER)

Endpoint: `POST /articles` (RESEARCHER only)

Prepare the payload:

- `trackId`: created in step 2.2
- `authors`: list of `AuthorDto` (the backend accepts `institution` object)

Example:

```powershell
curl -X POST http://localhost:8080/api/v1/articles \
  -H "Authorization: Bearer <RESEARCHER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Paper A",
    "abstract":"Abstract A",
    "conclusion":"Conclusion A",
    "link":"",
    "trackId":"<TRACK_ID>",
    "authors":[
      {"name":"Alice","email":"alice@example.com","institution":{"id":"<INST_ID>","name":"HCMUT","country":"VN"}},
      {"name":"Bob","email":"bob@example.com","institution":{"id":"<INST_ID>","name":"HCMUT","country":"VN"}}
    ]
  }'
```

Record the returned `articleId`.

### 3.2 Initial review (EDITOR)

Endpoint: `POST /articles/{id}/initial-review` (EDITOR only)

Approve (continue):

```powershell
curl -X POST http://localhost:8080/api/v1/articles/<ARTICLE_ID>/initial-review \
  -H "Authorization: Bearer <EDITOR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"decision":"APPROVE","note":"Looks good, proceed","nextSteps":"Contact reviewers"}'
```

Reject:

```powershell
curl -X POST http://localhost:8080/api/v1/articles/<ARTICLE_ID>/initial-review \
  -H "Authorization: Bearer <EDITOR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"decision":"REJECT","note":"Not in scope for this track"}'
```

### 3.3 Contact reviewers (EDITOR) + invite link

Endpoint: `POST /articles/{id}/reviewers/contact` (EDITOR only)

> Note: `ReviewerRequestDto` currently requires `articleId` in each `newReviewers` item; set it to the same value as the URL param.

```powershell
curl -X POST http://localhost:8080/api/v1/articles/<ARTICLE_ID>/reviewers/contact \
  -H "Authorization: Bearer <EDITOR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject":"Review request",
    "message":"Please review this paper",
    "reviewerIds":[],
    "newReviewers":[
      {"name":"Reviewer One","email":"reviewer1@example.com","institutionId":"<INST_ID>","articleId":"<ARTICLE_ID>"}
    ]
  }'
```

Open MailHog and find the email to `reviewer1@example.com`. It should contain a link like:

- `http://localhost:5173/reviewer-invite?token=...`

### 3.4 Reviewer invite → signup

1) Click the invite link.
2) The frontend resolves the token, stores it, and redirects to `/signup` with the email prefilled.
3) Complete signup verification via MailHog.
4) Complete `/info`.

Expected:
- The user is created with role `REVIEWER` (server-enforced)
- The `Reviewer` entity is linked to the created `User` (by email)
- The invite token becomes single-use

---

## 4) Negative test cases (RBAC + workflow)

### 4.1 RBAC

- Admin cannot submit articles:
  - Call `POST /articles` with ADMIN token → expect 403.
- User cannot submit articles:
  - Call `POST /articles` with USER token → expect 403.
- Researcher cannot initial-review:
  - Call `POST /articles/{id}/initial-review` with RESEARCHER token → expect 403.
- Researcher cannot contact reviewers:
  - Call `POST /articles/{id}/reviewers/contact` with RESEARCHER token → expect 403.

### 4.2 Workflow gating

- Initial review allowed only when article status is `SUBMITTED`:
  - Try initial review twice → second should fail.
- Contact reviewers allowed only when article status is `PENDING_REVIEW`:
  - Try contact reviewers before initial review approval → expect 400 with message about `PENDING_REVIEW`.

### 4.3 Invite token security

- Invalid token:
  - `GET /reviewer-invites/resolve?token=bad` → expect 400.
- Used token:
  - Use the invite token once (complete reviewer signup), then try resolving again → expect 400.
- Expired token:
  - In DB set `expires_at` to past for a token row, then resolve → expect 400.

---

## 5) Comment flow (basic API checks)

The comment endpoints exist under `/api/v1`:

- List: `GET /articles/{articleId}/comments`
- Create: `POST /articles/{articleId}/comments`
- Reply: `POST /comments/{threadId}/replies`
- Update status: `PATCH /comments/{threadId}/status`

Suggested coverage:

- Reviewer posts a comment thread on assigned article.
- Author can list comments and reply.
- Verify permissions/anonymity rules based on RBAC requirements.

---

## 6) Quick checklist (minimum regression)

- [ ] Sign-up works (email → verify → info)
- [ ] Sign-in works (email → verify → tokens)
- [ ] Track/institution CRUD works
- [ ] Researcher can submit
- [ ] Editor can initial-review only from SUBMITTED
- [ ] Editor can contact reviewers only from PENDING_REVIEW
- [ ] Reviewer invite link resolves + pre-fills email
- [ ] Reviewer signup forces REVIEWER role and consumes token
