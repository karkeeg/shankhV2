import { create } from "zustand";

export type ToastType = "info" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  showToast: (message, type = "info", duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
