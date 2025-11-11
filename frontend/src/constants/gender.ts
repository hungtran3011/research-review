export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
} as const;

export const GenderMap = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác'
} as const;

export type GenderType = typeof Gender[keyof typeof Gender];
