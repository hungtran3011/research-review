import { api } from './api';
import type { BaseResponseDto, PageResponseDto, InstitutionDto } from '../models';

/**
 * Institution service for handling institution-related API requests
 */
export const institutionService = {
  /**
   * Get all institutions with pagination
   */
  getAll: async (page: number = 0, size: number = 100): Promise<BaseResponseDto<PageResponseDto<InstitutionDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<InstitutionDto>>>(
      `/institutions?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * Get institution by ID
   */
  getById: async (id: string): Promise<BaseResponseDto<InstitutionDto>> => {
    const response = await api.get<BaseResponseDto<InstitutionDto>>(`/institutions/${id}`);
    return response.data;
  },

  /**
   * Create new institution
   */
  create: async (data: InstitutionDto): Promise<BaseResponseDto<InstitutionDto>> => {
    const response = await api.post<BaseResponseDto<InstitutionDto>>('/institutions', data);
    return response.data;
  },

  /**
   * Update institution
   */
  update: async (id: string, data: InstitutionDto): Promise<BaseResponseDto<InstitutionDto>> => {
    const response = await api.put<BaseResponseDto<InstitutionDto>>(`/institutions/${id}`, data);
    return response.data;
  },

  /**
   * Delete institution
   */
  delete: async (id: string): Promise<BaseResponseDto<string>> => {
    const response = await api.delete<BaseResponseDto<string>>(`/institutions/${id}`);
    return response.data;
  },
};
