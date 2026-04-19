# Conference Registration Gate Plan (2026-04-08)

## 1) Mục tiêu
Bắt buộc user phải đăng ký vào conference trước khi nộp bài.

- Không còn auto-create membership khi submit.
- Chỉ user có membership hợp lệ ở conference mới được submit.
- Luồng UX rõ ràng: chưa đăng ký -> thấy trạng thái/chỗ đăng ký -> chờ duyệt (nếu có) -> mới submit.

## 2) Hiện trạng & khoảng trống

### Hiện trạng quan trọng
- Backend đã có check `canSubmit(conferenceId)` theo membership qua `ConferenceAuthorizationService`.
- Nhưng trong `ArticlesServiceImpl.create(...)` đang có `ensureSubmitterConferenceMembership(...)` tự tạo membership `RESEARCHER` nếu user chưa có.

### Khoảng trống
- Chưa có API self-registration cho user vào conference.
- Chưa có trạng thái đăng ký (nếu cần quy trình duyệt).
- Frontend navbar/show submit chưa bám trạng thái membership theo conference cụ thể.

## 3) Scope đề xuất

## 3.1 MVP (khuyến nghị triển khai trước)
Đăng ký trực tiếp (auto-approve) theo conference đang mở đăng ký.

- User bấm "Đăng ký conference".
- Hệ thống tạo membership `RESEARCHER` ngay.
- Sau đó user được phép submit.

Ưu điểm: đơn giản, ít migration, đưa vào nhanh.

## 3.2 Phase 2 (nếu cần governance)
Đăng ký có duyệt.

- Thêm bảng request + trạng thái `PENDING/APPROVED/REJECTED/CANCELLED`.
- Editor/Admin duyệt request.
- Chỉ khi `APPROVED` mới tạo membership `RESEARCHER`.

## 4) Thiết kế backend (MVP)

### 4.1 Bỏ auto-membership khi submit (bắt buộc)
- File: `backend/src/main/kotlin/com/example/researchreview/services/impl/ArticlesServiceImpl.kt`
- Thay đổi:
  - Xóa logic `ensureSubmitterConferenceMembership(...)` trong `create(...)`.
  - Đổi sang kiểm tra cứng:
    - nếu không có membership conference -> ném `AccessDeniedException("conference.registration.required")`.

### 4.2 API đăng ký conference cho user
Tạo controller/service mới (user-facing), không trộn vào admin endpoints.

- `POST /api/conferences/{conferenceId}/registrations`
  - Auth required.
  - Nếu conference không cho đăng ký -> `400`.
  - Nếu đã có membership -> `409` (hoặc `200 idempotent`, chọn 1 chuẩn và giữ nhất quán).
  - Thành công -> `201` + membership DTO.

- `GET /api/conferences/{conferenceId}/registrations/me`
  - Trả trạng thái user với conference để FE render nút/nhãn.
  - Với MVP có thể trả:
    - `registered: true/false`
    - `membershipRole` nếu có.

### 4.3 Rule domain
- Chỉ cho đăng ký khi conference `OPEN_FOR_SUBMISSION` (hoặc cờ `allowRegistration=true`).
- Global `ADMIN` không submit bài (giữ đúng rule hiện tại).
- Membership duy nhất trên `(conference_id, user_id)` (đảm bảo bằng unique index nếu chưa có).

### 4.4 i18n/messages
Thêm key message backend:
- `conference.registration.required`
- `conference.registration.closed`
- `conference.registration.alreadyExists`

## 5) Thiết kế frontend (MVP)

### 5.1 UX
Ở form submit article:
- Bước chọn conference (hoặc khi conference đã chọn):
  - Nếu chưa đăng ký: disable nút submit + hiển thị CTA `Đăng ký conference`.
  - Bấm đăng ký -> gọi API registration.
  - Thành công -> refresh current user/membership + enable submit.

### 5.2 API client + hooks
- Tạo `conference-registration.service.ts`.
- Tạo hooks TanStack Query:
  - `useMyConferenceRegistration(conferenceId)`
  - `useRegisterConference(conferenceId)`

### 5.3 Điều chỉnh điều hướng
- `Nav.tsx` không nên chỉ dựa `isAuthenticated && !isAdmin` để hiện submit.
- Vẫn có thể giữ link submit, nhưng trong trang submit phải enforce conference-level registration rõ ràng.

## 6) Test plan triển khai

### 6.1 Backend unit/integration
- `create article` khi chưa membership -> `403` + `conference.registration.required`.
- `register conference` thành công -> `201`, membership role `RESEARCHER`.
- `register conference` lần 2 -> `409` (hoặc response idempotent theo quyết định).
- conference đóng đăng ký -> `400`.
- admin submit vẫn bị chặn như policy hiện tại.

### 6.2 Frontend
- Chưa đăng ký: submit button disabled + hiện CTA đăng ký.
- Đăng ký thành công: trạng thái đổi ngay, submit enable.
- API lỗi (409/400): toast đúng message.

### 6.3 E2E cập nhật
Bổ sung vào flow doc hiện tại:
- `REG-01` user chưa đăng ký không submit được.
- `REG-02` user đăng ký rồi submit thành công.
- `REG-03` conference đóng đăng ký.

## 7) Kế hoạch rollout

### Phase A (1-2 ngày)
- Backend bỏ auto-membership + thêm registration endpoint (MVP).
- Thêm message keys + tests backend.

### Phase B (1 ngày)
- Frontend CTA đăng ký ở submit flow + hooks/service.
- Cập nhật i18n FE + test UI chính.

### Phase C (0.5 ngày)
- Cập nhật tài liệu + postman collection + smoke test full flow.

## 8) Rủi ro & giảm thiểu
- Rủi ro: user cũ quen submit trực tiếp sẽ bị chặn.
  - Giảm thiểu: thông báo rõ trong UI + CTA one-click registration.
- Rủi ro: race condition đăng ký 2 lần.
  - Giảm thiểu: unique constraint + xử lý conflict rõ ràng.
- Rủi ro: thiếu đồng bộ cache current user/membership ở FE.
  - Giảm thiểu: invalidate query `currentUser` + registration query sau mutation.

## 9) Definition of Done
- Không còn auto tạo membership trong luồng submit.
- User chưa đăng ký conference không thể submit (được hướng dẫn đăng ký).
- User đăng ký xong submit được ngay trong conference hợp lệ.
- Backend compile/test pass, frontend type-check pass.
- Flow docs & postman đã cập nhật.
