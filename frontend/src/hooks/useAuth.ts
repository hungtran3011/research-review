import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import * as authService from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponseDto, BaseResponseDto } from '../models';
import { AuthBusinessCode, EmailBusinessCode } from '../constants/business-code';
import { AxiosError } from 'axios';

/**
 * Hook for sign up mutation
 */
export const useSignUp = () => {
  const navigate = useNavigate();
  const { setEmail, setIsSignUp } = useAuthStore();

  return useMutation<BaseResponseDto<AuthResponseDto>, AxiosError<BaseResponseDto<AuthResponseDto>>, string>({
    mutationFn: authService.signUp,
    onSuccess: (data, email) => {
      if (data.code === EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY) {
        setEmail(email);
        setIsSignUp(true);
        navigate('/needs-verify');
      } else if (data.code === AuthBusinessCode.EMAIL_VERIFIED) {
        setEmail(email);
        navigate('/info');
      }
    },
  });
};

/**
 * Hook for sign in mutation
 */
export const useSignIn = () => {
  const navigate = useNavigate();
  const { setEmail, setIsSignUp } = useAuthStore();

  return useMutation<BaseResponseDto<AuthResponseDto>, AxiosError<BaseResponseDto<AuthResponseDto>>, string>({
    mutationFn: authService.signIn,
    onSuccess: (data, email) => {
      if (data.code === EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY) {
        setEmail(email);
        setIsSignUp(false);
        navigate('/needs-verify');
      }
    },
  });
};

/**
 * Hook for verify token mutation
 */
export const useVerifyToken = () => {
  const navigate = useNavigate();
  const { setAuthenticated, setVerified } = useAuthStore();

  return useMutation<
    BaseResponseDto<AuthResponseDto>,
    AxiosError<BaseResponseDto<AuthResponseDto>>,
    { email: string; token: string; isSignUp: boolean }
  >({
    mutationFn: ({ email, token, isSignUp }) =>
      authService.verifyToken(email, token, isSignUp),
    onSuccess: (data) => {
      if (data.code === AuthBusinessCode.VERIFICATION_SUCCESS) {
        setVerified(true);
        setAuthenticated(true);
        // TODO: Extract tokens from response when backend implements JWT
        // setTokens(data.data.accessToken, data.data.refreshToken);
        navigate('/verify-success', { state: { fromVerify: true } });
      } else if (data.code === AuthBusinessCode.EMAIL_VERIFIED) {
        setVerified(true);
        navigate('/info');
      } else {
        navigate('/verify-failed');
      }
    },
    onError: () => {
      navigate('/verify-failed');
    },
  });
};

/**
 * Hook for resend magic link mutation
 */
export const useResendMagicLink = () => {
  return useMutation<
    BaseResponseDto<AuthResponseDto>,
    AxiosError<BaseResponseDto<AuthResponseDto>>,
    { email: string; isSignUp: boolean }
  >({
    mutationFn: ({ email, isSignUp }) => authService.resendMagicLink(email, isSignUp),
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
      navigate('/auth');
    },
  });
};
