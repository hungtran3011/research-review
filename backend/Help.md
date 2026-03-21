# Coding convention:
Bộ convention sẽ được quy chuẩn dần, nhưng sẽ có một số quy tắc cơ bản:
- Các response để sử dụng BaseResponseDto để bọc ngoài các giá trị trả về
- Controllers sẽ xử lý các exception để quy định response nào nên được trả về
- Với các mục dữ liệu thường dùng (email, số, ngày tháng v.v), việc validate sẽ thường được
thực hiện ở DTO thông qua các Annotation. Sau đó việc xử lý lỗi sẽ nằm trong file
exceptions/ExceptionController
- Có thể tạo thêm các Exception tuỳ chỉnh để dễ dàng xử lý các tình huống nghiệp vụ
- Ưu tiên dùng HTTP status code chuẩn cho trường `code` trong BaseResponseDto:
  - 200: Thành công
  - 201: Tạo mới thành công
  - 400: Yêu cầu không hợp lệ
  - 401/403: Lỗi xác thực/phân quyền
  - 404: Không tìm thấy tài nguyên
  - 500: Lỗi hệ thống