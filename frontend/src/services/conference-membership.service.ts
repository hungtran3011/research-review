import { api } from './api';
import type {
  BaseResponseDto,
  ConferenceMembershipDto,
} from '../models';

const BASE_PATH = '/admin/configuration';

/**
 * Conference membership service for managing conference member assignments
 */
export const conferenceMembershipService = {
  /**
   * Get all members for a specific conference
   */
  getMembers: async (conferenceId: string): Promise<BaseResponseDto<ConferenceMembershipDto[]>> => {
    const response = await api.get<BaseResponseDto<ConferenceMembershipDto[]>>(
      `${BASE_PATH}/conferences/${conferenceId}/members`
    );
    return response.data;
  },

  /**
   * Assign or update a user's role in a conference
   */
  assignMember: async (
    conferenceId: string,
    data: { userId: string; membershipRole: string }
  ): Promise<BaseResponseDto<ConferenceMembershipDto>> => {
    const response = await api.post<BaseResponseDto<ConferenceMembershipDto>>(
      `${BASE_PATH}/conferences/${conferenceId}/members`,
      data
    );
    return response.data;
  },

  /**
   * Remove a user from a conference
   */
  removeMember: async (
    conferenceId: string,
    userId: string
  ): Promise<BaseResponseDto<void>> => {
    const response = await api.delete<BaseResponseDto<void>>(
      `${BASE_PATH}/conferences/${conferenceId}/members/${userId}`
    );
    return response.data;
  },
};
