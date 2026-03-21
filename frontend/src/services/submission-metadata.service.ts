import { api } from './api';
import type { BaseResponseDto, SubmissionMetadataDto } from '../models';

export const submissionMetadataService = {
  get: async (): Promise<BaseResponseDto<SubmissionMetadataDto>> => {
    const response = await api.get<BaseResponseDto<SubmissionMetadataDto>>('/submissions/metadata');
    return response.data;
  },
};