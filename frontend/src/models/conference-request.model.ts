import { ConferenceStatus } from './conference.model';

export interface ConferenceCreateRequestDto {
  name: string;
  shortName: string;
  season?: string | null;
  year?: number | null;
  description?: string | null;
  status: ConferenceStatus;
  submissionDeadline?: string | null;
  minimumCompletedReviews?: number;
}

export interface ConferenceUpdateRequestDto {
  name: string;
  shortName: string;
  season?: string | null;
  year?: number | null;
  description?: string | null;
  status: ConferenceStatus;
  submissionDeadline?: string | null;
  minimumCompletedReviews: number;
}

export interface ConferenceSettingsPatchRequestDto {
  status?: ConferenceStatus;
  submissionDeadline?: string | null;
  minimumCompletedReviews?: number;
}
