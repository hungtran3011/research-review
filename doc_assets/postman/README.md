# Postman collection

- File: `research-review.postman_collection.json`
- Import into Postman: File → Import → Select the JSON file.

Suggested variables to fill after import (collection variables):

- `baseUrl` (default: <http://localhost:8080>)
- `apiPrefix` (default: api/v1)
- `magicToken` (copy from email)
- `accessToken` / `refreshToken` (auto-filled by Verify/Refresh requests)
- `inviteToken` (copy from reviewer invite link email)

Typical sequence (happy path):

1) 00 - Smoke → GET /test
2) 02 - Reference Data → create Institution, create Track
3) 01 - Auth → signup + verify (signup)
4) 03 - Users → complete-info (RESEARCHER)
5) 01 - Auth → signin + verify (signin) to get JWT with RESEARCHER role
6) 04 - Articles → submit
7) Switch to an EDITOR token (requires editor user exists in DB) then run initial-review and contact-reviewers
8) 05 - Reviewer Invite → resolve token, reviewer complete-info via inviteToken
