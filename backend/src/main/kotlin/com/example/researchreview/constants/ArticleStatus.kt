package com.example.researchreview.constants

enum class ArticleStatus(val value: Short){
    SUBMITTED(0), // Chờ xử lý
    REJECTED(1), // Bị từ chối
    PENDING_REVIEW(2), // chờ review
    IN_REVIEW(3), // đang review
    REVISIONS_REQUESTED(4), // yêu cầu sửa chữa
    REVISIONS(5), // đang sửa chữa
    ACCEPTED(6), // đã chấp nhận
    REJECT_REQUESTED(7), // Đề nghị loại bỏ
    ACCEPT_REQUESTED(8), // Đề nghị chấp thuận
}