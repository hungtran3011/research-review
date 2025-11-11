import { api } from './api';
import type { BaseResponseDto, TrackDto, TrackRequestDto } from '../models';

/**
 * Track service for handling track-related API requests
 */
export const trackService = {
  /**
   * Get all tracks
   */
  getAll: async (): Promise<BaseResponseDto<TrackDto[]>> => {
    const response = await api.get<BaseResponseDto<TrackDto[]>>('/tracks');
    return response.data;
  },

  /**
   * Get track by ID
   */
  getById: async (id: string): Promise<BaseResponseDto<string>> => {
    const response = await api.get<BaseResponseDto<string>>(`/tracks/${id}`);
    return response.data;
  },

  /**
   * Create new track
   */
  create: async (data: TrackRequestDto): Promise<BaseResponseDto<TrackDto>> => {
    const response = await api.post<BaseResponseDto<TrackDto>>('/tracks', data);
    return response.data;
  },

  /**
   * Update track
   */
  update: async (id: string, data: TrackRequestDto): Promise<BaseResponseDto<TrackDto>> => {
    const response = await api.put<BaseResponseDto<TrackDto>>(`/tracks/${id}`, data);
    return response.data;
  },

  /**
   * Delete track
   */
  delete: async (id: string): Promise<BaseResponseDto<string>> => {
    const response = await api.delete<BaseResponseDto<string>>(`/tracks/${id}`);
    return response.data;
  },
};
