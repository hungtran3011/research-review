export interface ConferenceDto {
  id: string;
  name: string;
  shortName: string;
  season?: string | null;
  year?: number | null;
  description?: string | null;
  status: ConferenceStatus;
  submissionDeadline?: string | null;
  minimumCompletedReviews: number;
  createdAt: string;
  updatedAt: string;
}

export const ConferenceStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type ConferenceStatus = typeof ConferenceStatus[keyof typeof ConferenceStatus];
