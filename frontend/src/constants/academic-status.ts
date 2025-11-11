export const AcademicStatus = {
  GSTS: 'GSTS',    // Giáo sư - Tiến sĩ
  PGSTS: 'PGSTS',  // Phó giáo sư - Tiến sĩ
  TS: 'TS',        // Tiến sĩ
  THS: 'THS',      // Thạc sĩ
  CN: 'CN',        // Cử nhân
  UNKNOWN: 'UNKNOWN'
} as const;

export type AcademicStatusType = typeof AcademicStatus[keyof typeof AcademicStatus];
