export const AccountStatus = {
  ACTIVE: 0,
  INACTIVE: 1
} as const;

export type AccountStatusType = typeof AccountStatus[keyof typeof AccountStatus];