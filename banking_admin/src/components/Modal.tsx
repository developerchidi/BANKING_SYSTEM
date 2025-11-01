import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string; // e.g., 'max-w-lg'
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, children, widthClass = 'max-w-lg' }) => {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${widthClass} max-h-[80vh] overflow-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5`}> 
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Modal;

