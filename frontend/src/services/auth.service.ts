import { api } from './api';
import type {
  AuthRequestDto,
  BaseResponseDto,
  AuthResponseDto,
  VerifyTokenRequestDto,
  RefreshTokenRequestDto,
} from '../models';

/**
 * Sign up with email - sends magic link to email
 */
export const signUp = async (email: string): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email } as AuthRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/signup', body);
  return response.data;
};

/**
 * Sign in with email - sends magic link to email
 */
export const signIn = async (email: string): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email } as AuthRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/signin', body);
  return response.data;
};

/**
 * Verify magic link token
 */
export const verifyToken = async (
  email: string,
  token: string,
  isSignUp: boolean
): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email, token, isSignUp } as VerifyTokenRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/verify', body);
  return response.data;
};

/**
 * Resend magic link code
 */
export const resendMagicLink = async (email: string, isSignUp: boolean): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email, isSignUp } as AuthRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/resend-code', body);
  return response.data;
};

/**
 * Sign out
 */
export const signOut = async (): Promise<AuthResponseDto> => {
  const response = await api.post<AuthResponseDto>('/auth/signout');
  return response.data;
};

export const refreshTokens = async (refreshToken: string): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { refreshToken } as RefreshTokenRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/refresh', body);
  return response.data;
};
