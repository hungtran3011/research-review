# Coding convention:
Bộ convention sẽ được quy chuẩn dần, nhưng sẽ có một số quy tắc cơ bản:
- Các response để sử dụng BaseResponseDto để bọc ngoài các giá trị trả về
- Controllers sẽ xử lý các exception để quy định response nào nên được trả về
- Với các mục dữ liệu thường dùng (email, số, ngày tháng v.v), việc validate sẽ thường được
thực hiện ở DTO thông qua các Annotation. Sau đó việc xử lý lỗi sẽ nằm trong file
exceptions/ExceptionController
- Có thể tạo thêm các Exception tuỳ chỉnh để dễ dàng xử lý với các BusinessCode khác nhau
- Các Business code sẽ được thêm vào trong file constants/BusinessCode.kt, với quy chuẩn như sau:
  - 1xxx: Các mã thông báo liên quan tới Auth
  - 2xxx: Các mã thông báo liên quan tới validation
  - 3xxx: Các mã thông báo liên quan tới người dùng
  - 4xxx: Các mã thông báo liên quan tới Articles
  - 5xxx: Các mã thông báo liên quan tới template
  - 99999: Mã chung cho lỗi hệ thống