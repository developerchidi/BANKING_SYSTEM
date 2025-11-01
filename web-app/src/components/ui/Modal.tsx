import React from 'react';

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal = React.memo<ModalProps>(({ open, onClose, title, children, className = '', ...rest }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`} {...rest}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-0 bg-transparent shadow-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default Modal; 