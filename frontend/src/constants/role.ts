export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export const RoleLabels: Record<RoleType, string> = {
  [Role.ADMIN]: 'Quản trị viên',
  [Role.USER]: 'Người dùng',
};

export const RoleOptions: { value: RoleType; label: string }[] = Object.entries(RoleLabels).map(
  ([value, label]) => ({ value: value as RoleType, label })
);