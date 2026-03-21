import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import * as authService from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponseDto, BaseResponseDto } from '../models';
import { AxiosError } from 'axios';
import { getApiErrorMessage, getApiSuccessMessage, useBasicToast } from './useBasicToast';

/**
 * Hook for sign up mutation
 */
export const useSignUp = () => {
  const navigate = useNavigate();
  const { setEmail, setIsSignUp } = useAuthStore();
  const { success, error } = useBasicToast();

  return useMutation<BaseResponseDto<AuthResponseDto>, AxiosError<BaseResponseDto<AuthResponseDto>>, { email: string; deviceFingerprint?: string }>({
    mutationFn: authService.signUp,
    onSuccess: (data, params) => {
      success(getApiSuccessMessage(data, 'Đã gửi email xác thực.'));
      setEmail(params.email);
      setIsSignUp(true);
      // Check if user needs to complete info or verify email
      if (data.data?.accessToken) {
        navigate('/info');
      } else {
        navigate('/needs-verify');
      }
    },
    onError: (err) => {
      error(getApiErrorMessage(err, 'Không thể đăng ký. Vui lòng thử lại.'));
    },
  });
};

/**
 * Hook for sign in mutation
 */
export const useSignIn = () => {
  const navigate = useNavigate();
  const { setEmail, setIsSignUp } = useAuthStore();
  const { success, error } = useBasicToast();

  return useMutation<BaseResponseDto<AuthResponseDto>, AxiosError<BaseResponseDto<AuthResponseDto>>, { email: string; deviceFingerprint?: string }>({
    mutationFn: authService.signIn,
    onSuccess: (data, params) => {
      success(getApiSuccessMessage(data, 'Đã gửi email đăng nhập.'));
      setEmail(params.email);
      setIsSignUp(false);
      navigate('/needs-verify');
    },
    onError: (err) => {
      error(getApiErrorMessage(err, 'Không thể đăng nhập. Vui lòng thử lại.'));
    },
  });
};

/**
 * Hook for verify token mutation
 */
export const useVerifyToken = () => {
  const navigate = useNavigate();
  const { setAuthenticated, setVerified, setTokens } = useAuthStore();
  const { success, error } = useBasicToast();

  return useMutation<
    BaseResponseDto<AuthResponseDto>,
    AxiosError<BaseResponseDto<AuthResponseDto>>,
    { email: string; token: string; isSignUp: boolean; deviceFingerprint?: string }
  >({
    mutationFn: (params) => authService.verifyToken(params),
    onSuccess: (data) => {
      success(getApiSuccessMessage(data, 'Xác thực thành công.'));
      setVerified(true);
      const accessToken = data.data?.accessToken;
      if (accessToken) {
        setAuthenticated(true);
        setTokens(accessToken, null);
        navigate('/verify-success', { state: { fromVerify: true } });
      } else {
        // User still needs to complete info
        navigate('/info');
      }
    },
    onError: (err) => {
      error(getApiErrorMessage(err, 'Xác thực thất bại.'));
      navigate('/verify-failed');
    },
  });
};

/**
 * Hook for resend magic link mutation
 */
export const useResendMagicLink = () => {
  const { success, error } = useBasicToast();
  return useMutation<
    BaseResponseDto<AuthResponseDto>,
    AxiosError<BaseResponseDto<AuthResponseDto>>,
    { email: string; isSignUp: boolean }
  >({
    mutationFn: ({ email, isSignUp }) => authService.resendMagicLink(email, isSignUp),
    onSuccess: (data) => {
      success(getApiSuccessMessage(data, 'Đã gửi lại email.'));
    },
    onError: (err) => {
      error(getApiErrorMessage(err, 'Không thể gửi lại email.'));
    },
  });
};

/**
 * Hook for sign out mutation
 */
export const useSignOut = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation<AuthResponseDto, AxiosError>({
    mutationFn: authService.signOut,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/signin');
    },
  });
};
