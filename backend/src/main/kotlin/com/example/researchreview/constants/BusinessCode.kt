package com.example.researchreview.constants

// AuthBusinessCode will start at 1
enum class AuthBusinessCode(val value: Int) {
    USER_NOT_FOUND(1001),
    EMAIL_VERIFIED(1002),
    EMAIL_NOT_VERIFIED(1003),
    EMAIL_SENT(1004),
    INVALID_TOKEN(1005),
    VERIFICATION_SUCCESS(1006)
}

// ValidationErrorCode will start at 2
enum class ValidationErrorCode(val value: Int) {
    BLANK_FIELD(2001),
    EMAIL_INVALID(2002),
}

enum class TemplateBusinessCode(val value: Int) {
    TEMPLATE_NOT_FOUND(3001),
    TEMPLATE_CREATED_FAIL(3002),
    TEMPLATE_CREATED_SUCCESSFULLY(3003),
    TEMPLATE_FOUND(3004),
}

enum class SpecialErrorCode(val value: Int) {
    GENERAL_ERROR(99999)
}