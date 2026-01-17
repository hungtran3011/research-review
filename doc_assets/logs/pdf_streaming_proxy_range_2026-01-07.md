# PDF streaming proxy with Range support (2026-01-07)

## Change summary

- Added a same-origin PDF streaming endpoint to avoid S3 presigned URL CORS/Range issues in the in-app PDF.js viewer.
- Implemented HTTP `Range` handling so PDF.js can request partial content.

## Backend

- New endpoint: `GET /api/v1/articles/{articleId}/pdf`
  - Enforces RBAC via `ArticleAccessGuard.fetchAccessibleArticle(articleId)`.
  - Streams the latest `SUBMISSION` attachment (status `AVAILABLE`) for the article.
  - Supports `Range` requests (returns `206 Partial Content` when Range is provided).

### Convention notes

- Controller logic is thin; all repository/S3 logic lives in a service layer (`ArticlePdfService` + `ArticlePdfServiceImpl`).
- This endpoint returns a binary stream rather than `BaseResponseDto` because PDF.js requires proper HTTP streaming + Range semantics.
- Status codes are intentionally HTTP-native here (`200` full content, `206` partial content, `416` invalid range). Returning `200` with `BaseResponseDto` would break Range support.

## Frontend

- `react-pdf` requests are configured to include authentication headers/credentials so it can fetch the same-origin endpoint.
- Review UI now uses the backend proxy URL instead of `article.link`.
- Editor initial review page now also uses the backend proxy URL instead of `article.link`.
- The viewer no longer depends on `article.link` being present; if the link is blank/expired (presigned), it falls back to the proxy URL.

## Files changed

- backend
  - backend/src/main/kotlin/com/example/researchreview/controllers/ArticlePdfController.kt
  - backend/src/main/kotlin/com/example/researchreview/services/ArticlePdfService.kt
  - backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlePdfServiceImpl.kt
  - backend/src/main/kotlin/com/example/researchreview/services/S3Service.kt
  - backend/src/main/kotlin/com/example/researchreview/services/impl/S3ServiceImpl.kt
  - backend/src/main/kotlin/com/example/researchreview/repositories/AttachmentRepository.kt
  - backend/src/main/kotlin/com/example/researchreview/configs/CorsConfig.kt
- frontend
  - frontend/src/components/common/PdfViewer.tsx
  - frontend/src/components/article/EditorInitialReview.tsx
  - frontend/src/components/article/ReviewArticle.tsx
