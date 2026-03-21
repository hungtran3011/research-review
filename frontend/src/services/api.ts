import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';

type BaseResponseLike = {
  data?: {
    accessToken?: string;
  };
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
    // Just return the response without business code checking
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
