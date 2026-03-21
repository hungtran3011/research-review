import { api } from './api';
import type {
  BaseResponseDto,
  ConferenceDto,
  ConferenceCreateRequestDto,
  ConferenceUpdateRequestDto,
  ConferenceSettingsPatchRequestDto,
} from '../models';

const BASE_PATH = '/admin/configuration';

/**
 * Conference service for handling conference-related API requests (admin)
 */
export const conferenceService = {
  /**
   * Get all conferences
   */
  getAll: async (): Promise<BaseResponseDto<ConferenceDto[]>> => {
    const response = await api.get<BaseResponseDto<ConferenceDto[]>>(`${BASE_PATH}/conferences`);
    return response.data;
  },

  /**
   * Get conference by ID
   */
  getById: async (conferenceId: string): Promise<BaseResponseDto<ConferenceDto>> => {
    const response = await api.get<BaseResponseDto<ConferenceDto>>(
      `${BASE_PATH}/conferences/${conferenceId}`
    );
    return response.data;
  },

  /**
   * Create new conference
   */
  create: async (data: ConferenceCreateRequestDto): Promise<BaseResponseDto<ConferenceDto>> => {
    const response = await api.post<BaseResponseDto<ConferenceDto>>(
      `${BASE_PATH}/conferences`,
      data
    );
    return response.data;
  },

  /**
   * Update conference
   */
  update: async (
    conferenceId: string,
    data: ConferenceUpdateRequestDto
  ): Promise<BaseResponseDto<ConferenceDto>> => {
    const response = await api.put<BaseResponseDto<ConferenceDto>>(
      `${BASE_PATH}/conferences/${conferenceId}`,
      data
    );
    return response.data;
  },

  /**
   * Patch conference settings (partial update)
   */
  patchSettings: async (
    conferenceId: string,
    data: ConferenceSettingsPatchRequestDto
  ): Promise<BaseResponseDto<ConferenceDto>> => {
    const response = await api.patch<BaseResponseDto<ConferenceDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/settings`,
      data
    );
    return response.data;
  },

  /**
   * Delete conference
   */
  delete: async (conferenceId: string): Promise<BaseResponseDto<void>> => {
    const response = await api.delete<BaseResponseDto<void>>(
      `${BASE_PATH}/conferences/${conferenceId}`
    );
    return response.data;
  },
};
