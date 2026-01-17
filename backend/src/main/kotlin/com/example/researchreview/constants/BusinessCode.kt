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

enum class UserBusinessCode(val value: Int) {
    USER_NOT_FOUND(6001),
    USER_FOUND(6002),
    USER_CREATED_SUCCESSFULLY(6003),
    USER_CREATION_FAILED(6004),
    USER_UPDATED_SUCCESSFULLY(6005),
    USER_UPDATE_FAILED(6006),
    USER_ALREADY_EXISTS(6007),
}

enum class ArticleBusinessCode(val value: Int) {
    ARTICLE_CREATED_SUCCESSFULLY(7001),
    ARTICLE_CREATED_FAIL(7002),
    ARTICLE_FOUND(7003),
    ARTICLE_NOT_FOUND(7004),
    ARTICLE_UPDATED_SUCCESSFULLY(7005),
    ARTICLE_STATUS_UPDATED(7006),
}

enum class ReviewerBusinessCode(val value: Int) {
    REVIEWER_ASSIGNED(8000),
    REVIEWER_CONTACTED(8001),
    REVIEWER_CONTACT_FAILED(8002),
    REVIEWER_UNASSIGNED(8003),
    REVIEWER_ASSIGNMENT_FAILED(8004),
}

enum class CommentBusinessCode(val value: Int) {
    COMMENT_THREAD_CREATED(9001),
    COMMENT_THREAD_FOUND(9002),
    COMMENT_THREAD_UPDATED(9003),
    COMMENT_THREAD_NOT_FOUND(9004)
}

enum class NotificationBusinessCode(val value: Int) {
    NOTIFICATION_FOUND(10001),
    NOTIFICATION_UPDATED(10002)
}

enum class AttachmentBusinessCode(val value: Int) {
    ATTACHMENT_UPLOAD_SLOT_CREATED(11001),
    ATTACHMENT_FINALIZED(11002),
    ATTACHMENT_LIST_FOUND(11003),
    ATTACHMENT_DELETED(11004)
}

enum class UploadBusinessCode(val value: Int) {
    SUBMISSION_FILE_UPLOADED(12001)
}

enum class SpecialErrorCode(val value: Int) {
    GENERAL_ERROR(99999),
    INTERNAL_ERROR(500),
    BAD_REQUEST(400)
}