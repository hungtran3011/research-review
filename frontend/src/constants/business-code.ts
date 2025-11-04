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

export const SpecialErrorCode = {
  GENERAL_ERROR: 99999,
  INTERNAL_ERROR: 500
} as const;

export type SpecialErrorCodeType = typeof SpecialErrorCode[keyof typeof SpecialErrorCode];