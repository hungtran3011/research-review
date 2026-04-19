export const ConferenceMembershipRole = {
  RESEARCHER: 'RESEARCHER',
  EDITOR: 'EDITOR',
  REVIEWER: 'REVIEWER',
} as const;

export type ConferenceMembershipRole =
  typeof ConferenceMembershipRole[keyof typeof ConferenceMembershipRole];

export interface ConferenceMembershipDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  conferenceId: string;
  conferenceName: string;
  membershipRole: ConferenceMembershipRole;
  createdAt?: string | null;
  updatedAt?: string | null;
}