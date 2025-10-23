package com.example.researchreview.dtos

import org.springframework.data.domain.Page

/**
 * DTO để wrap dữ liệu phân trang
 * Sử dụng với BaseResponseDto để trả về API có phân trang
 */
data class PageResponseDto<T>(
    val content: List<T>,
    val pageNumber: Int,
    val pageSize: Int,
    val totalElements: Long,
    val totalPages: Int,
    val isFirst: Boolean,
    val isLast: Boolean,
    val hasNext: Boolean,
    val hasPrevious: Boolean
) {
    companion object {
        fun <T> from(page: Page<T>): PageResponseDto<T> {
            return PageResponseDto(
                content = page.content,
                pageNumber = page.number,
                pageSize = page.size,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                isFirst = page.isFirst,
                isLast = page.isLast,
                hasNext = page.hasNext(),
                hasPrevious = page.hasPrevious()
            )
        }
    }
}

