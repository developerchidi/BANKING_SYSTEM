import React from 'react';
import { useNotification } from '../../context/NotificationContext';

const typeStyles: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white',
};

export const Notification: React.FC = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) return null;

  return (
    <div className={`fixed z-50 bottom-6 left-1/2 transform -translate-x-1/2 min-w-[240px] max-w-xs px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${typeStyles[notification.type]}`}
      role="alert"
      style={{ animation: 'fadeInUp 0.3s' }}
    >
      <span className="flex-1 font-medium">{notification.message}</span>
      <button onClick={hideNotification} className="ml-4 text-white/80 hover:text-white text-lg font-bold">×</button>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}; 