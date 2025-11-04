import { useToastController, Toast, ToastTitle, ToastBody } from "@fluentui/react-components";
import { useId } from "@fluentui/react-components";
import type { JSX } from "react";

export type ToastIntent = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  body?: string;
  intent?: ToastIntent;
  action?: JSX.Element;
}

export function useBasicToast() {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

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
    toasterId,
    showToast,
    success,
    error,
    warning,
    info,
  };
}