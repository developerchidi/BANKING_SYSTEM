import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType, duration = 3000) => {
    setNotification({ message, type, duration });
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setNotification(null), duration);
    setTimeoutId(id);
  }, [timeoutId]);

  const hideNotification = useCallback(() => {
    setNotification(null);
    if (timeoutId) clearTimeout(timeoutId);
  }, [timeoutId]);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
} 