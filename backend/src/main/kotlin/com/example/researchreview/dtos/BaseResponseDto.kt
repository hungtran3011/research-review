package com.example.researchreview.dtos

/**
 * Khuôn dạng dữ liệu trả về cho API
 * Sử dụng theo dạng BaseResponseDto<DTO>
 *     - Lưu ý: Phần code phải sử dụng BusinessCode enum để dễ dàng quản lý mã lỗi
 */
data class BaseResponseDto<T>(
    val code: Int,
    val message: String,
    val data: T? = null
)