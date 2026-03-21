package com.example.researchreview.dtos

/**
 * Khuôn dạng dữ liệu trả về cho API
 * Sử dụng theo dạng BaseResponseDto<DTO>
 *     - code dùng mã số kiểu HTTP (200, 201, 400, 404, 500)
 */
data class BaseResponseDto<T>(
    val code: Int,
    val message: String,
    val data: T? = null
)