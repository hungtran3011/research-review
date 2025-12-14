export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type AccountStatusType = typeof AccountStatus[keyof typeof AccountStatus];

export const AccountStatusLabels: Record<AccountStatusType, string> = {
  [AccountStatus.ACTIVE]: 'Hoạt động',
  [AccountStatus.INACTIVE]: 'Bị khóa',
};

export const AccountStatusOptions = [
  { value: AccountStatus.ACTIVE, label: AccountStatusLabels[AccountStatus.ACTIVE] },
  { value: AccountStatus.INACTIVE, label: AccountStatusLabels[AccountStatus.INACTIVE] },
];