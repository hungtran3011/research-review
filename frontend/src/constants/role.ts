export const Role = {
  ADMIN: 0,
  USER: 1,
  EDITOR: 2,
  RESEARCHER: 3,
  REVIEWER: 4
} as const;

export type RoleType = typeof Role[keyof typeof Role];