import { api } from './api';
import type { UserRequestDto } from '../models';
import type { BaseResponseDto } from '../models';
import type { UserDto } from '../models';

/**
 * User service for handling user-related API requests
 */
export const userService = {
  /**
   * Complete user info after email verification
   */
  completeUserInfo: async (data: UserRequestDto): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.post<BaseResponseDto<UserDto>>('/users/complete-info', data);
    return response.data;
  },

  /**
   * Get current user by email
   */
  getCurrentUser: async (email: string): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.get<BaseResponseDto<UserDto>>(`/users/me?email=${email}`);
    return response.data;
  },

  /**
   * Update user information
   */
  updateUser: async (id: string, data: UserRequestDto): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.put<BaseResponseDto<UserDto>>(`/users/${id}`, data);
    return response.data;
  },
};
