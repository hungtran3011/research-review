import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/authStore';
import { useBasicToast } from './useBasicToast';
import type { UserRequestDto } from '../models';
import type { AxiosError } from 'axios';
import type { BaseResponseDto } from '../models';

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
