import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500" />,
          info: <Info className="w-5 h-5 text-blue-500" />,
        };

        const bgColors = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          error: 'bg-rose-50 border-rose-200 text-rose-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
        };

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 p-4 pr-12 rounded-xl border shadow-lg relative animate-in slide-in-from-right-8 fade-in duration-300 min-w-[280px]",
              bgColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
