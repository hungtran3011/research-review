import { api } from './api';
import type {
  AuthRequestDto,
  BaseResponseDto,
  AuthResponseDto,
  VerifyTokenRequestDto,
} from '../models';

/**
 * Sign up with email - sends magic link to email
 */
export const signUp = async (params: { email: string; deviceFingerprint?: string }): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email: params.email, deviceFingerprint: params.deviceFingerprint } as AuthRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/signup', body);
  return response.data;
};

/**
 * Sign in with email - sends magic link to email
 */
export const signIn = async (params: { email: string; deviceFingerprint?: string }): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { email: params.email, deviceFingerprint: params.deviceFingerprint } as AuthRequestDto;
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/signin', body);
  return response.data;
};

/**
 * Verify magic link token
 */
export const verifyToken = async (params: {
  email: string;
  token: string;
  isSignUp: boolean;
  deviceFingerprint?: string;
}): Promise<BaseResponseDto<AuthResponseDto>> => {
  const body = { 
    email: params.email, 
    token: params.token, 
    isSignUp: params.isSignUp,
    deviceFingerprint: params.deviceFingerprint 
  } as VerifyTokenRequestDto;
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

export const refreshTokens = async (): Promise<BaseResponseDto<AuthResponseDto>> => {
  const response = await api.post<BaseResponseDto<AuthResponseDto>>('/auth/refresh');
  return response.data;
};
