// AuthBusinessCode will start at 1
export const AuthBusinessCode = {
  USER_NOT_FOUND: 1001,
  EMAIL_VERIFIED: 1002,
  EMAIL_NOT_VERIFIED: 1003,
  EMAIL_SENT: 1004,
  INVALID_TOKEN: 1005,
  VERIFICATION_SUCCESS: 1006
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
  TEMPLATE_FOUND: 3004
} as const;

export type TemplateBusinessCodeType = typeof TemplateBusinessCode[keyof typeof TemplateBusinessCode];

export const SpecialErrorCode = {
  GENERAL_ERROR: 99999
} as const;

export type SpecialErrorCodeType = typeof SpecialErrorCode[keyof typeof SpecialErrorCode];