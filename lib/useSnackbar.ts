import { create } from 'zustand';

type SnackbarState = {
  message: string | null;
  show: (msg: string) => void;
  hide: () => void;
};

export const useSnackbar = create<SnackbarState>((set) => ({
  message: null,
  show: (msg) => {
    set({ message: msg });
    setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => set({ message: null }),
}));