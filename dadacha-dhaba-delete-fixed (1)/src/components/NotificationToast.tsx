import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-[#141414]/95 text-emerald-400 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-[#141414]/95 text-rose-400 border-rose-500/40'
              : 'bg-[#141414]/95 text-[#F4B400] border-[#F4B400]/40'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-[#F4B400]" />}
          <p className="text-sm font-semibold text-white leading-snug">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};
