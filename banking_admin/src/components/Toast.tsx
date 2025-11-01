import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X } from 'lucide-react';

export interface ToastProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ open, title = 'Thành công', message, onClose, durationMs = 3000 }) => {
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(id);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 pointer-events-none z-[1100]">
      <div className="absolute right-4 top-4 space-y-2 pointer-events-auto">
        <div className="flex items-start gap-3 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 p-4 w-[360px]">
          <div className="mt-0.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{title}</div>
            {message && <div className="text-sm text-gray-600 mt-0.5">{message}</div>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Toast;

