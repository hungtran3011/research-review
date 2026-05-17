package com.example.researchreview.constants

enum class ErrorCode(val key: String) {
    INTERNAL_SERVER("error.internal.server"),
    ARTICLE_NOT_FOUND("article.notFound"),
    ARTICLE_VERSION_NOT_FOUND("articleVersion.articleOrAttachmentNotFound"),
    ARTICLE_VERSION_INVALID_REQUEST("articleVersion.invalidRequest")
}
