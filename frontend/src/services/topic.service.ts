import { api } from './api';
import type {
  BaseResponseDto,
  TopicDto,
  TopicCreateRequestDto,
  TopicUpdateRequestDto,
} from '../models';

const BASE_PATH = '/admin/configuration';

/**
 * Topic service for handling topic-related API requests (admin)
 */
export const topicService = {
  /**
   * Get all topics for a conference, optionally filtered by track
   */
  getAll: async (conferenceId: string, trackId?: string): Promise<BaseResponseDto<TopicDto[]>> => {
    const params = trackId ? { trackId } : undefined;
    const response = await api.get<BaseResponseDto<TopicDto[]>>(
      `${BASE_PATH}/conferences/${conferenceId}/topics`,
      { params }
    );
    return response.data;
  },

  /**
   * Create new topic
   */
  create: async (
    conferenceId: string,
    data: TopicCreateRequestDto
  ): Promise<BaseResponseDto<TopicDto>> => {
    const response = await api.post<BaseResponseDto<TopicDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/topics`,
      data
    );
    return response.data;
  },

  /**
   * Update topic
   */
  update: async (
    conferenceId: string,
    topicId: string,
    data: TopicUpdateRequestDto
  ): Promise<BaseResponseDto<TopicDto>> => {
    const response = await api.put<BaseResponseDto<TopicDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/topics/${topicId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete topic
   */
  delete: async (conferenceId: string, topicId: string): Promise<BaseResponseDto<void>> => {
    const response = await api.delete<BaseResponseDto<void>>(
      `${BASE_PATH}/conferences/${conferenceId}/topics/${topicId}`
    );
    return response.data;
  },
};
