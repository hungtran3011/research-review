export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  EDITOR: 'EDITOR',
  RESEARCHER: 'RESEARCHER',
  REVIEWER: 'REVIEWER',
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export const RoleLabels: Record<RoleType, string> = {
  [Role.ADMIN]: 'Quản trị viên',
  [Role.USER]: 'Người dùng',
  [Role.EDITOR]: 'Biên tập viên',
  [Role.RESEARCHER]: 'Nhà nghiên cứu',
  [Role.REVIEWER]: 'Phản biện',
};

export const RoleOptions: { value: RoleType; label: string }[] = Object.entries(RoleLabels).map(
  ([value, label]) => ({ value: value as RoleType, label })
);