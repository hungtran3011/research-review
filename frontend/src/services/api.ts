import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { isBusinessErrorCode } from '../constants/business-code';

type BaseResponseLike = {
  code: number;
  message: string;
  data?: unknown;
};

const isBaseResponseLike = (value: unknown): value is BaseResponseLike => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Record<string, unknown>;
  return typeof maybe.code === 'number' && typeof maybe.message === 'string';
};

const createBusinessAxiosError = (response: AxiosResponse<BaseResponseLike>): AxiosError => {
  const business = response.data;
  return new AxiosError(
    business.message || 'Request failed',
    String(business.code),
    response.config,
    response.request,
    response
  );
};

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    const resp = await axios.post<BaseResponseLike & { data?: { accessToken?: string } }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    const access = resp.data?.data?.accessToken;
    if (access) {
      useAuthStore.getState().setTokens(access, null);
      useAuthStore.getState().setAuthenticated(true);
      return access;
    }
    return null;
  } catch {
    return null;
  } finally {
    refreshPromise = null;
  }
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session management
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    // Only enforce business-code failures on BaseResponseDto-like payloads.
    // This keeps compatibility with non-JSON endpoints (e.g., downloads, HTML, etc.).
    if (isBaseResponseLike(data) && isBusinessErrorCode(data.code)) {
      return Promise.reject(createBusinessAxiosError(response as AxiosResponse<BaseResponseLike>));
    }

    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = performRefresh();
      }
      return refreshPromise.then((accessToken) => {
        if (!accessToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      });
    }

    return Promise.reject(error);
  }
);
