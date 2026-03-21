import { message } from 'antd'
import type { AxiosError } from "axios";

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

export const getApiSuccessMessage = (response: unknown, fallback: string): string => {
  if (isBaseResponseLike(response) && response.message) return response.message;
  return fallback;
};

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const axiosErr = err as AxiosError<BaseResponseLike>;
  const msg = axiosErr?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (axiosErr?.message) return axiosErr.message;
  return fallback;
};

export type ToastIntent = "success" | "error" | "warning" | "info";

export function useBasicToast() {
  const success = (title: string) => {
    message.success(title);
  };

  const error = (title: string) => {
    message.error(title);
  };

  const warning = (title: string) => {
    message.warning(title);
  };

  const info = (title: string) => {
    message.info(title);
  };

  return {
    success,
    error,
    warning,
    info,
  };
}