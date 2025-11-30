package com.example.researchreview.constants

enum class ReviewerInvitationStatus(val value: Byte) {
    PENDING(0),
    ACCEPTED(1),
    DECLINED(2),
    REVOKED(3)
}
