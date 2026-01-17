# Fix expired presigned links by persisting proxy URL (2026-01-07)

## Problem

- Users hit S3 XML error:
  - `AccessDenied`
  - `Request has expired`
  - Because presigned URLs were generated with `X-Amz-Expires=900` (15 minutes) and later opened after expiry.

## Root cause

- The submit flow was persisting a presigned S3 GET URL into `article.link` after upload.
- Presigned URLs are time-limited by design, so storing them in DB makes the link inevitably expire.

## Fix

- After uploading the submission attachment, persist the stable backend PDF proxy URL instead:
  - `GET /api/v1/articles/{articleId}/pdf`
- This keeps `article.link` usable long-term and avoids S3 presign expiry.

## Files changed

- frontend/src/components/article/SubmitArticle.tsx
