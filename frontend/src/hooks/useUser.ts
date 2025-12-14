import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/authStore';
import { useBasicToast } from './useBasicToast';
import type {
  UserRequestDto,
  UserRoleUpdateRequestDto,
  UserStatusUpdateRequestDto,
  UserDto,
  PageResponseDto,
  BaseResponseDto,
} from '../models';
import type { AxiosError } from 'axios';

/**
 * Hook for completing user info
 */
export const useCompleteUserInfo = () => {
  const navigate = useNavigate();
  const { success, error } = useBasicToast();
  const { setAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: (data: UserRequestDto) => userService.completeUserInfo(data),
    onSuccess: () => {
      setAuthenticated(true);
      success('Hoàn tất đăng ký thành công!');
      navigate('/');
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất đăng ký';
      error(message);
    },
  });
};

/**
 * Hook for fetching current user
 */
export const useCurrentUser = (email: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['currentUser', email],
    queryFn: () => userService.getCurrentUser(email),
    enabled: enabled && !!email,
  });
};

/**
 * Hook for fetching paginated users (admin)
 */
export const useUsers = (page: number = 0, size: number = 20, enabled: boolean = true) => {
  return useQuery<BaseResponseDto<PageResponseDto<UserDto>> | undefined>({
    queryKey: ['adminUsers', page, size],
    queryFn: () => userService.getUsers({ page, size }),
    enabled,
  });
};

/**
 * Hook for updating user info
 */
export const useUpdateUser = () => {
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserRequestDto }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      success('Cập nhật thông tin thành công!');
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      error(message);
    },
  });
};

/**
 * Hook for updating user role
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserRoleUpdateRequestDto }) =>
      userService.updateUserRole(id, data),
    onSuccess: () => {
      success('Cập nhật vai trò người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò';
      error(message);
    },
  });
};

/**
 * Hook for updating user status
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserStatusUpdateRequestDto }) =>
      userService.updateUserStatus(id, data),
    onSuccess: () => {
      success('Cập nhật trạng thái người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
      error(message);
    },
  });
};

/**
 * Hook for deleting a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      success('Xóa người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng';
      error(message);
    },
  });
};
