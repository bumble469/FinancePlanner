import { create } from 'zustand';

type SnackbarType = 'success' | 'error' | 'warning' | 'info';

type SnackbarState = {
  message: string | null;
  type: SnackbarType;
  show: (msg: string, type?: SnackbarType) => void;
  hide: () => void;
};

export const useSnackbar = create<SnackbarState>((set) => ({
  message: null,
  type: 'info',
  show: (msg, type = 'info') => {
    set({ message: msg, type });
    setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => set({ message: null }),
}));