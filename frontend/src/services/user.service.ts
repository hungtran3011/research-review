import { api } from './api';
import type {
  AdminCreateUserRequestDto,
  UserRequestDto,
  BaseResponseDto,
  UserDto,
  PageResponseDto,
  UserRoleUpdateRequestDto,
  UserStatusUpdateRequestDto,
} from '../models';

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
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.get<BaseResponseDto<UserDto>>(`/users/me`);
    return response.data;
  },

  /**
   * Get paginated list of users (admin only)
   */
  getUsers: async (
    params: { page?: number; size?: number } = {}
  ): Promise<BaseResponseDto<PageResponseDto<UserDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<UserDto>>>(`/users`, {
      params,
    });
    return response.data;
  },

  searchUsers: async (
    params: {
      page?: number;
      size?: number;
      name?: string;
      email?: string;
      institutionName?: string;
      role?: string;
      status?: string;
    } = {}
  ): Promise<BaseResponseDto<PageResponseDto<UserDto>>> => {
    const response = await api.get<BaseResponseDto<PageResponseDto<UserDto>>>(`/users/search`, {
      params,
    });
    return response.data;
  },

  /**
   * Create a new user (admin only)
   */
  createUserAsAdmin: async (
    data: AdminCreateUserRequestDto
  ): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.post<BaseResponseDto<UserDto>>(`/users`, data);
    return response.data;
  },

  /**
   * Update user information
   */
  updateUser: async (id: string, data: UserRequestDto): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.put<BaseResponseDto<UserDto>>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Update a user's role (admin only)
   */
  updateUserRole: async (
    id: string,
    data: UserRoleUpdateRequestDto
  ): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.patch<BaseResponseDto<UserDto>>(`/users/${id}/role`, data);
    return response.data;
  },

  /**
   * Update a user's status (admin only)
   */
  updateUserStatus: async (
    id: string,
    data: UserStatusUpdateRequestDto
  ): Promise<BaseResponseDto<UserDto>> => {
    const response = await api.patch<BaseResponseDto<UserDto>>(`/users/${id}/status`, data);
    return response.data;
  },

  /**
   * Delete a user (admin only)
   */
  deleteUser: async (id: string): Promise<BaseResponseDto<null>> => {
    const response = await api.delete<BaseResponseDto<null>>(`/users/${id}`);
    return response.data;
  },
};
