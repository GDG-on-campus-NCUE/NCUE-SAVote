import React from 'react';
import { useToastStore, ToastType } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border shadow-lg animate-slide-in-right",
            bgColors[toast.type]
          )}
        >
          <div className="shrink-0">{icons[toast.type]}</div>
          <p className="flex-1 text-sm font-bold text-[var(--color-on-surface)] leading-tight">
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4 opacity-40" />
          </button>
        </div>
      ))}
    </div>
  );
};
