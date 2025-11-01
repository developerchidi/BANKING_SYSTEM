import NotificationWebSocketServer from './notification-websocket.service';

// Global WebSocket instance
let notificationWS: NotificationWebSocketServer | null = null;

export const setNotificationWebSocket = (ws: NotificationWebSocketServer) => {
  notificationWS = ws;
};

export const getNotificationWebSocket = () => notificationWS;
