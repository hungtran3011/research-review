export const AttachmentKind = {
  SUBMISSION: 'SUBMISSION',
  REVISION: 'REVISION',
  SUPPLEMENTAL: 'SUPPLEMENTAL',
} as const;

export type AttachmentKindType = typeof AttachmentKind[keyof typeof AttachmentKind];
