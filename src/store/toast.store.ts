import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

type ToastState = {
  toasts: ToastItem[];

  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (toast) => {
    const id = createToastId();
    const duration = toast.duration ?? 3000;

    const newToast: ToastItem = {
      ...toast,
      id,
      duration,
    };

    set({
      toasts: [...get().toasts, newToast],
    });

    window.setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set({
      toasts: get().toasts.filter((toast) => toast.id !== id),
    });
  },

  clearToasts: () => {
    set({
      toasts: [],
    });
  },
}));