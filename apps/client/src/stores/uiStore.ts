import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface UIState {
  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;

  // 全局加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  globalLoading: false,

  showToast: (message, type = 'info', duration = 3000) => {
    const id = 'toast-' + ++toastCounter;
    const toast: Toast = { id, message, type, duration };

    set((s) => ({ toasts: [...s.toasts, toast] }));

    // loading 类型不倒计时自动移除
    if (type !== 'loading') {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
  },

  dismissToast: (id) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    }));
  },

  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
