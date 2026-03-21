import { api } from './api';
import type {
  BaseResponseDto,
  AdminTrackConfigDto,
  AdminTrackConfigCreateRequestDto,
  AdminTrackConfigUpdateRequestDto,
} from '../models';

const BASE_PATH = '/admin/configuration';

/**
 * Admin track service for conference-scoped track management
 */
export const adminTrackService = {
  /**
   * Get all tracks for a conference
   */
  getAll: async (conferenceId: string): Promise<BaseResponseDto<AdminTrackConfigDto[]>> => {
    const response = await api.get<BaseResponseDto<AdminTrackConfigDto[]>>(
      `${BASE_PATH}/conferences/${conferenceId}/tracks`
    );
    return response.data;
  },

  /**
   * Create new track in a conference
   */
  create: async (
    conferenceId: string,
    data: AdminTrackConfigCreateRequestDto
  ): Promise<BaseResponseDto<AdminTrackConfigDto>> => {
    const response = await api.post<BaseResponseDto<AdminTrackConfigDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/tracks`,
      data
    );
    return response.data;
  },

  /**
   * Update track
   */
  update: async (
    conferenceId: string,
    trackId: string,
    data: AdminTrackConfigUpdateRequestDto
  ): Promise<BaseResponseDto<AdminTrackConfigDto>> => {
    const response = await api.put<BaseResponseDto<AdminTrackConfigDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/tracks/${trackId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete track
   */
  delete: async (conferenceId: string, trackId: string): Promise<BaseResponseDto<void>> => {
    const response = await api.delete<BaseResponseDto<void>>(
      `${BASE_PATH}/conferences/${conferenceId}/tracks/${trackId}`
    );
    return response.data;
  },
};
