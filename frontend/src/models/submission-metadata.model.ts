export interface SubmissionTopicOptionDto {
  id: string;
  name: string;
}

export interface SubmissionTrackOptionDto {
  id: string;
  name: string;
  topics: SubmissionTopicOptionDto[];
}

export interface SubmissionConferenceOptionDto {
  id: string;
  name: string;
  shortName: string;
  submissionDeadline?: string | null;
  tracks: SubmissionTrackOptionDto[];
}

export interface SubmissionMetadataDto {
  conferences: SubmissionConferenceOptionDto[];
}