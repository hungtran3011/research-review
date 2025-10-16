package com.example.researchreview.constants

enum class ArticleStatus(val value: Short){
    SUBMITTED(0), // Chờ xử lý
    REJECTED(1), // Bị từ chối
    PENDING_REVIEW(2), // chờ review
    IN_REVIEW(3), // đang review
    REJECT_REQUESTED(4), // đề nghị loại bỏ
    ACCEPTED(5), // đã chấp nhận
}