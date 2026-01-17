// AuthBusinessCode will start at 1
export const AuthBusinessCode = {
  USER_NOT_FOUND: 1001,
  EMAIL_VERIFIED: 1002,
  EMAIL_NOT_VERIFIED: 1003,
  INVALID_TOKEN: 1004,
  VERIFICATION_SUCCESS: 1005,
  USER_ALREADY_EXISTS: 1006,
} as const;

export type AuthBusinessCodeType = typeof AuthBusinessCode[keyof typeof AuthBusinessCode];

// ValidationErrorCode will start at 2
export const ValidationErrorCode = {
  BLANK_FIELD: 2001,
  EMAIL_INVALID: 2002
} as const;

export type ValidationErrorCodeType = typeof ValidationErrorCode[keyof typeof ValidationErrorCode];

export const TemplateBusinessCode = {
  TEMPLATE_NOT_FOUND: 3001,
  TEMPLATE_CREATED_FAIL: 3002,
  TEMPLATE_CREATED_SUCCESSFULLY: 3003,
  TEMPLATE_FOUND: 3004,
  TEMPLATE_UPDATED_SUCCESSFULLY: 3005,
  TEMPLATE_UPDATED_FAIL: 3006,
  TEMPLATE_DELETED_SUCCESSFULLY: 3007,
  TEMPLATE_DELETED_FAIL: 3008
} as const;

export type TemplateBusinessCodeType = typeof TemplateBusinessCode[keyof typeof TemplateBusinessCode];

export const EditorBusinessCode = {
  EDITOR_NOT_FOUND: 4001,
  EDITOR_CREATED_FAIL: 4002,
  EDITOR_CREATED_SUCCESSFULLY: 4003,
  EDITOR_FOUND: 4004
} as const;

export type EditorBusinessCodeType = typeof EditorBusinessCode[keyof typeof EditorBusinessCode];

export const EmailBusinessCode = {
  EMAIL_SENT_SUCCESSFULLY: 5001,
  EMAIL_SENT_FAIL: 5002
} as const;

export type EmailBusinessCodeType = typeof EmailBusinessCode[keyof typeof EmailBusinessCode];

export const UserBusinessCode = {
  USER_NOT_FOUND: 6001,
  USER_FOUND: 6002,
  USER_CREATED_SUCCESSFULLY: 6003,
  USER_CREATION_FAILED: 6004,
  USER_UPDATED_SUCCESSFULLY: 6005,
  USER_UPDATE_FAILED: 6006,
  USER_ALREADY_EXISTS: 6007,
} as const;

export type UserBusinessCodeType = typeof UserBusinessCode[keyof typeof UserBusinessCode];

export const ArticleBusinessCode = {
  ARTICLE_CREATED_SUCCESSFULLY: 7001,
  ARTICLE_CREATED_FAIL: 7002,
  ARTICLE_FOUND: 7003,
  ARTICLE_NOT_FOUND: 7004,
  ARTICLE_UPDATED_SUCCESSFULLY: 7005,
  ARTICLE_STATUS_UPDATED: 7006,
} as const;

export type ArticleBusinessCodeType = typeof ArticleBusinessCode[keyof typeof ArticleBusinessCode];

export const ReviewerBusinessCode = {
  REVIEWER_CONTACTED: 8001,
  REVIEWER_CONTACT_FAILED: 8002,
  REVIEWER_UNASSIGNED: 8003,
} as const;

export type ReviewerBusinessCodeType = typeof ReviewerBusinessCode[keyof typeof ReviewerBusinessCode];

export const CommentBusinessCode = {
  COMMENT_THREAD_CREATED: 9001,
  COMMENT_THREAD_FOUND: 9002,
  COMMENT_THREAD_UPDATED: 9003,
  COMMENT_THREAD_NOT_FOUND: 9004,
} as const;

export type CommentBusinessCodeType = typeof CommentBusinessCode[keyof typeof CommentBusinessCode];

export const NotificationBusinessCode = {
  NOTIFICATION_FOUND: 10001,
  NOTIFICATION_UPDATED: 10002,
} as const;

export type NotificationBusinessCodeType =
  typeof NotificationBusinessCode[keyof typeof NotificationBusinessCode];

export const AttachmentBusinessCode = {
  ATTACHMENT_UPLOAD_SLOT_CREATED: 11001,
  ATTACHMENT_FINALIZED: 11002,
  ATTACHMENT_LIST_FOUND: 11003,
  ATTACHMENT_DELETED: 11004,
} as const;

export type AttachmentBusinessCodeType =
  typeof AttachmentBusinessCode[keyof typeof AttachmentBusinessCode];

export const UploadBusinessCode = {
  SUBMISSION_FILE_UPLOADED: 12001,
} as const;

export type UploadBusinessCodeType = typeof UploadBusinessCode[keyof typeof UploadBusinessCode];

export const SpecialErrorCode = {
  GENERAL_ERROR: 99999,
  INTERNAL_ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

export type SpecialErrorCodeType = typeof SpecialErrorCode[keyof typeof SpecialErrorCode];

const BUSINESS_CODE_GROUPS = [
  AuthBusinessCode,
  ValidationErrorCode,
  TemplateBusinessCode,
  EditorBusinessCode,
  EmailBusinessCode,
  UserBusinessCode,
  ArticleBusinessCode,
  ReviewerBusinessCode,
  CommentBusinessCode,
  NotificationBusinessCode,
  AttachmentBusinessCode,
  UploadBusinessCode,
  SpecialErrorCode,
] as const;

const BUSINESS_CODE_KEY_BY_VALUE = (() => {
  const map = new Map<number, string>();
  for (const group of BUSINESS_CODE_GROUPS) {
    for (const [key, value] of Object.entries(group)) {
      if (typeof value === 'number' && !map.has(value)) {
        map.set(value, key);
      }
    }
  }
  return map;
})();

const ERROR_KEY_RE =
  /(^|_)(FAIL|FAILED|NOT_FOUND|INVALID|NOT_VERIFIED|UNAUTHORIZED|FORBIDDEN|ALREADY_EXISTS|CREATION_FAILED|UPDATE_FAILED)($|_)/;

export const isBusinessErrorCode = (code: number): boolean => {
  const key = BUSINESS_CODE_KEY_BY_VALUE.get(code);
  if (key) {
    return ERROR_KEY_RE.test(key) || code === SpecialErrorCode.GENERAL_ERROR;
  }

  // Fallback for codes not present in the constant tables.
  return code === SpecialErrorCode.GENERAL_ERROR || (code >= 400 && code < 600);
};