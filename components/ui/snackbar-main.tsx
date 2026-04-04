'use client';

import { useSnackbar } from '@/lib/useSnackbar';

export function Snackbar() {
  const { message } = useSnackbar();

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-black text-white px-4 py-2 rounded-md shadow-lg">
        {message}
      </div>
    </div>
  );
}