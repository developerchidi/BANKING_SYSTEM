import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      console.log('🔌 New WebSocket connection attempt');
      console.log(`   Request URL: ${req.url}`);
      console.log(`   Headers: ${JSON.stringify(req.headers)}`);

      // Extract query parameters
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      const token = url.searchParams.get('token');

      console.log(`   UserId: ${userId}`);
      console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'null'}`);

      // Authenticate user
      if (!userId || !token) {
        console.log('❌ WebSocket connection rejected: Missing credentials');
        ws.close(1008, 'Missing credentials');
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        if (decoded.userId !== userId) {
          console.log('WebSocket connection rejected: Invalid token');
          ws.close(1008, 'Invalid token');
          return;
        }

        // Store user ID in WebSocket
        ws.userId = userId;
        ws.isAlive = true;

        // Add to clients map (prevent duplicates)
        if (!this.clients.has(userId)) {
          this.clients.set(userId, []);
        }
        
        // Check if user already has too many connections (limit to 2)
        const existingConnections = this.clients.get(userId)!;
        const activeConnections = existingConnections.filter(existingWs => 
          existingWs.readyState === WebSocket.OPEN
        );
        
        if (activeConnections.length >= 2) {
          console.log(`⚠️ Too many connections for user: ${userId} (${activeConnections.length}/2)`);
          ws.close(1000, 'Too many connections');
          return;
        }
        
        // Clean up dead connections
        this.clients.set(userId, activeConnections);
        
        this.clients.get(userId)!.push(ws);

        console.log(`✅ WebSocket connected for user: ${userId}`);
        console.log(`   Total connections for user: ${this.clients.get(userId)?.length}`);
        console.log(`   Total users connected: ${this.clients.size}`);
        console.log(`   Total WebSocket connections: ${this.wss.clients.size}`);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection_established',
          message: 'Connected to notification service',
          timestamp: new Date().toISOString()
        }));

        // Setup ping/pong for connection health
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle incoming messages
        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            console.log(`Message from user ${userId}:`, message);
            
            // Echo back the message for testing
            ws.send(JSON.stringify({
              type: 'echo',
              originalMessage: message,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        // Handle disconnection
        ws.on('close', (code, reason) => {
          console.log(`🔌 WebSocket disconnected for user: ${userId}`);
          console.log(`   Close code: ${code}`);
          console.log(`   Close reason: ${reason}`);
          this.removeClient(userId, ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error(`❌ WebSocket error for user ${userId}:`, error);
          this.removeClient(userId, ws);
        });

      } catch (error) {
        console.log('WebSocket connection rejected: Invalid token verification');
        ws.close(1008, 'Invalid token');
      }
    });

    // Setup ping interval to keep connections alive
    const pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`Terminating inactive connection for user: ${ws.userId}`);
          ws.terminate();
          if (ws.userId) {
            this.removeClient(ws.userId, ws);
          }
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Ping every 30 seconds

    this.wss.on('close', () => {
      clearInterval(pingInterval);
    });
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket) {
    console.log(`🗑️ Removing client for user: ${userId}`);
    const userClients = this.clients.get(userId);
    if (userClients) {
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
        console.log(`   Removed client at index: ${index}`);
      }
      
      if (userClients.length === 0) {
        this.clients.delete(userId);
        console.log(`   No more clients for user: ${userId}`);
      } else {
        console.log(`   Remaining clients for user: ${userClients.length}`);
      }
    }
    console.log(`   Total users connected: ${this.clients.size}`);
    console.log(`   Total WebSocket connections: ${this.wss.clients.size}`);
  }

  // Send notification to specific user
  public sendToUser(userId: string, notification: any) {
    console.log(`🔔 Attempting to send notification to user: ${userId}`);
    console.log(`📋 Notification type: ${notification.type}`);
    console.log(`📋 Notification payload:`, notification.payload);
    
    const userClients = this.clients.get(userId);
    console.log(`👥 Active connections for user ${userId}: ${userClients?.length || 0}`);
    
    if (userClients && userClients.length > 0) {
      const message = JSON.stringify({
        type: notification.type,
        payload: notification.payload,
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Sending message: ${message}`);

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          console.log(`✅ Message sent to user ${userId}`);
        } else {
          console.log(`❌ WebSocket not open for user ${userId}, state: ${ws.readyState}`);
        }
      });

      console.log(`✅ Notification sent to user ${userId}:`, notification.type);
    } else {
      console.log(`❌ No active connections for user: ${userId}`);
      console.log(`📊 Total connected users: ${this.clients.size}`);
      console.log(`📊 Total connections: ${this.wss.clients.size}`);
    }
  }

  // Send notification to multiple users
  public sendToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });
  }

  // Broadcast to all connected users
  public broadcast(notification: any) {
    const message = JSON.stringify({
      type: notification.type,
      payload: notification.payload,
      timestamp: new Date().toISOString()
    });

    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    console.log(`Broadcast notification sent to ${this.wss.clients.size} clients`);
  }

  // Get connection statistics
  public getStats() {
    const stats = {
      totalConnections: this.wss.clients.size,
      connectedUsers: this.clients.size,
      userConnections: Array.from(this.clients.entries()).map(([userId, clients]) => ({
        userId,
        connectionCount: clients.length
      }))
    };

    return stats;
  }
}

export default NotificationWebSocketServer;
