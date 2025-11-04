package com.example.researchreview.constants

// AuthBusinessCode will start at 1
enum class AuthBusinessCode(val value: Int) {
    USER_NOT_FOUND(1001),
    EMAIL_VERIFIED(1002),
    EMAIL_NOT_VERIFIED(1003),
    INVALID_TOKEN(1004),
    VERIFICATION_SUCCESS(1005),
    USER_ALREADY_EXISTS(1006),
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
    TEMPLATE_UPDATED_SUCCESSFULLY(3005),
    TEMPLATE_UPDATED_FAIL(3006),
    TEMPLATE_DELETED_SUCCESSFULLY(3007),
    TEMPLATE_DELETED_FAIL(3008)
}

enum class EditorBusinessCode(val value: Int) {
    EDITOR_NOT_FOUND(4001),
    EDITOR_CREATED_FAIL(4002),
    EDITOR_CREATED_SUCCESSFULLY(4003),
    EDITOR_FOUND(4004),
}

enum class EmailBusinessCode(val value: Int) {
    EMAIL_SENT_SUCCESSFULLY(5001),
    EMAIL_SENT_FAIL(5002)
}

enum class SpecialErrorCode(val value: Int) {
    GENERAL_ERROR(99999),
    INTERNAL_ERROR(500)
}