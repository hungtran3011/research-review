import { useToastController, Toast, ToastTitle, ToastBody } from "@fluentui/react-components";
import type { JSX } from "react";
import { APP_TOASTER_ID } from "../constants/toaster";
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
  const message = axiosErr?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (axiosErr?.message) return axiosErr.message;
  return fallback;
};

export type ToastIntent = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  body?: string;
  intent?: ToastIntent;
  action?: JSX.Element;
}

export function useBasicToast() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);

  const showToast = ({ title, body, intent = "info", action }: ToastOptions) => {
    dispatchToast(
      <Toast>
        <ToastTitle action={action}>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent }
    );
  };

  const success = (title: string, body?: string) => {
    showToast({ title, body, intent: "success" });
  };

  const error = (title: string, body?: string) => {
    showToast({ title, body, intent: "error" });
  };

  const warning = (title: string, body?: string) => {
    showToast({ title, body, intent: "warning" });
  };

  const info = (title: string, body?: string) => {
    showToast({ title, body, intent: "info" });
  };

  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
}