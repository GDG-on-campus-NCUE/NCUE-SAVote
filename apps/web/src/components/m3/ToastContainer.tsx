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
    success: 'bg-white/70 dark:bg-green-900/40 border-green-500/50 shadow-green-500/20',
    error: 'bg-white/70 dark:bg-red-900/40 border-red-500/50 shadow-red-500/20',
    info: 'bg-white/70 dark:bg-blue-900/40 border-blue-500/50 shadow-blue-500/20',
    warning: 'bg-white/70 dark:bg-amber-900/40 border-amber-500/50 shadow-amber-500/20',
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border shadow-xl animate-slide-in-right backdrop-blur-xl backdrop-saturate-150",
            bgColors[toast.type]
          )}
        >
          <div className="shrink-0 p-2 rounded-xl bg-white/50 dark:bg-black/20 shadow-sm">{icons[toast.type]}</div>
          <p className="flex-1 text-sm font-bold text-gray-900 dark:text-white leading-tight">
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
};
