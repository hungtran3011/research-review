import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/authStore';
import { useBusinessToast } from './businessToast';
import type {
  AdminCreateUserRequestDto,
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
  const { showSuccess, showErrorFromAxios } = useBusinessToast();
  const { setAuthenticated, setInviteToken, inviteToken } = useAuthStore();

  return useMutation({
    mutationFn: (data: UserRequestDto) => userService.completeUserInfo(data),
    onSuccess: (response) => {
      setAuthenticated(true);
      showSuccess(response, 'Hoàn tất đăng ký thành công!');
      if (inviteToken) {
        navigate(`/reviewer-invite?token=${encodeURIComponent(inviteToken)}`);
      } else {
        navigate('/');
      }
      setInviteToken(undefined);
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi hoàn tất đăng ký');
    },
  });
};

/**
 * Hook for fetching current user
 */
export const useCurrentUser = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled,
  });
};

/**
 * Hook for fetching paginated users (admin) with optional filters
 */
export const useUsers = (
  page: number = 0,
  size: number = 20,
  filters: Partial<{ name: string; email: string; institutionName: string; role: string; status: string }> = {},
  enabled: boolean = true
) => {
  const hasFilters = Object.values(filters).some((v) => (v ?? '').toString().trim().length > 0);
  return useQuery<BaseResponseDto<PageResponseDto<UserDto>> | undefined>({
    queryKey: ['adminUsers', page, size, filters],
    queryFn: () =>
      hasFilters
        ? userService.searchUsers({ page, size, ...filters })
        : userService.getUsers({ page, size }),
    enabled,
  });
};

/**
 * Hook for creating a user (admin)
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (data: AdminCreateUserRequestDto) => userService.createUserAsAdmin(data),
    onSuccess: (response) => {
      showSuccess(response, 'Tạo người dùng thành công!', [200, 6003]);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi tạo người dùng');
    },
  });
};

/**
 * Hook for updating user info
 */
export const useUpdateUser = () => {
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserRequestDto }) =>
      userService.updateUser(id, data),
    onSuccess: (response) => {
      showSuccess(response, 'Cập nhật thông tin thành công!', [200, 6005]);
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi cập nhật thông tin');
    },
  });
};

/**
 * Hook for updating user role
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserRoleUpdateRequestDto }) =>
      userService.updateUserRole(id, data),
    onSuccess: (response) => {
      showSuccess(response, 'Cập nhật vai trò người dùng thành công!', [200, 6005]);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi cập nhật vai trò');
    },
  });
};

/**
 * Hook for updating user status
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserStatusUpdateRequestDto }) =>
      userService.updateUserStatus(id, data),
    onSuccess: (response) => {
      showSuccess(response, 'Cập nhật trạng thái người dùng thành công!', [200, 6005]);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi cập nhật trạng thái');
    },
  });
};

/**
 * Hook for deleting a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showErrorFromAxios } = useBusinessToast();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: (response) => {
      showSuccess(response, 'Xóa người dùng thành công!', [200]);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: AxiosError<BaseResponseDto<null>>) => {
      showErrorFromAxios(err, 'Có lỗi xảy ra khi xóa người dùng');
    },
  });
};
