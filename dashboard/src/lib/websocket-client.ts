/**
 * WebSocket Client for Dashboard Real-time Updates
 * 
 * Provides a robust WebSocket connection to the server with automatic
 * reconnection, message handling, and connection status tracking.
 */

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

export type MessageType = 
  | 'connection' 
  | 'config-change'
  | 'log-update'
  | 'health-update'
  | 'project-change'
  | 'group-update'
  | 'skill-change'
  | 'error';

export interface WebSocketMessage {
  id: string;
  type: MessageType;
  channel: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  data: any;
  correlationId?: string;
}

export interface WebSocketClientOptions {
  url?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export type MessageHandler = (message: WebSocketMessage) => void;
export type StatusHandler = (status: ConnectionStatus) => void;
export type ErrorHandler = (error: Error) => void;

/**
 * WebSocket Client Class
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private debug: boolean;
  
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private status: ConnectionStatus = 'disconnected';
  
  private messageHandlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  
  constructor(options: WebSocketClientOptions = {}) {
    // Determine WebSocket URL
    if (options.url) {
      this.url = options.url;
    } else {
      // Auto-detect based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:3000';
      this.url = `${protocol}//${host}/ws`;
    }
    
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
    this.debug = options.debug || false;
  }
  
  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || 
        this.ws?.readyState === WebSocket.CONNECTING) {
      this.log('Already connected or connecting');
      return;
    }
    
    this.log(`Connecting to ${this.url}...`);
    this.updateStatus('connecting');
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.log('Connection error:', error);
      this.handleConnectionError(error as Error);
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting...');
    this.stopReconnect();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }
    
    this.updateStatus('disconnected');
  }
  
  /**
   * Send message to server
   */
  send(type: MessageType, data: any, options: {
    channel?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    correlationId?: string;
  } = {}): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: not connected');
      return false;
    }
    
    const message: WebSocketMessage = {
      id: this.generateId(),
      type,
      channel: options.channel || 'default',
      priority: options.priority || 'NORMAL',
      timestamp: Date.now(),
      data,
      correlationId: options.correlationId
    };
    
    try {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message:', message);
      return true;
    } catch (error) {
      this.log('Send error:', error);
      this.notifyError(error as Error);
      return false;
    }
  }
  
  /**
   * Subscribe to messages of a specific type
   */
  on(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    this.log(`Subscribed to ${type} messages`);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
      this.log(`Unsubscribed from ${type} messages`);
    };
  }
  
  /**
   * Subscribe to connection status changes
   */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    
    // Immediately call with current status
    handler(this.status);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
  }
  
  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.errorHandlers.delete(handler);
    };
  }
  
  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.log('Connected!');
    this.reconnectAttempts = 0;
    this.updateStatus('connected');
    this.startHeartbeat();
    
    // Send initial subscription message
    this.send('connection', {
      action: 'subscribe',
      channels: ['ALL']
    });
  }
  
  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Received message:', message);
      
      // Notify handlers for this message type
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.log('Handler error:', error);
          }
        });
      }
    } catch (error) {
      this.log('Message parse error:', error);
      this.notifyError(error as Error);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log('Connection closed:', event.code, event.reason);
    this.stopHeartbeat();
    
    // Attempt reconnection if not a clean close
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus('failed');
    } else {
      this.updateStatus('disconnected');
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    const error = new Error('WebSocket connection error');
    this.notifyError(error);
  }
  
  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.notifyError(error);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      this.updateStatus('failed');
    }
  }
  
  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    this.updateStatus('reconnecting');
    
    const delay = this.reconnectDelay * this.reconnectAttempts;
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('connection', { action: 'ping' });
      }
    }, this.heartbeatInterval);
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Update connection status and notify handlers
   */
  private updateStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    
    this.status = status;
    this.log(`Status changed: ${status}`);
    
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        this.log('Status handler error:', error);
      }
    });
  }
  
  /**
   * Notify error handlers
   */
  private notifyError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        this.log('Error handler error:', handlerError);
      }
    });
  }
  
  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}

/**
 * Create and return a singleton WebSocket client instance
 */
let clientInstance: WebSocketClient | null = null;

export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  if (!clientInstance) {
    clientInstance = new WebSocketClient(options);
  }
  return clientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetWebSocketClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

