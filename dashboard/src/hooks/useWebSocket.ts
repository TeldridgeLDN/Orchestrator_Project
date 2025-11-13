/**
 * React Hook for WebSocket Connection
 * 
 * Provides easy access to WebSocket functionality in React components
 * with automatic connection management and cleanup.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  WebSocketClient, 
  getWebSocketClient, 
  ConnectionStatus,
  MessageType,
  WebSocketMessage,
  MessageHandler
} from '../lib/websocket-client';

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  debug?: boolean;
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  error: Error | null;
  send: (type: MessageType, data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (type: MessageType, handler: MessageHandler) => void;
  unsubscribe: (type: MessageType, handler: MessageHandler) => void;
}

/**
 * Custom hook for WebSocket connection
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, debug = false, url } = options;
  
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);
  const subscriptionsRef = useRef<Map<MessageType, Set<MessageHandler>>>(new Map());
  
  // Initialize client
  useEffect(() => {
    clientRef.current = getWebSocketClient({ url, debug });
    
    // Subscribe to status changes
    const unsubscribeStatus = clientRef.current.onStatus((newStatus) => {
      setStatus(newStatus);
    });
    
    // Subscribe to errors
    const unsubscribeError = clientRef.current.onError((err) => {
      setError(err);
    });
    
    // Auto-connect if enabled
    if (autoConnect) {
      clientRef.current.connect();
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribeStatus();
      unsubscribeError();
      
      // Unsubscribe all message handlers
      subscriptionsRef.current.forEach((handlers, type) => {
        handlers.forEach(handler => {
          clientRef.current?.on(type, handler);
        });
      });
      subscriptionsRef.current.clear();
    };
  }, [autoConnect, debug, url]);
  
  // Connect function
  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);
  
  // Disconnect function
  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);
  
  // Send message function
  const send = useCallback((type: MessageType, data: any): boolean => {
    return clientRef.current?.send(type, data) || false;
  }, []);
  
  // Subscribe to message type
  const subscribe = useCallback((type: MessageType, handler: MessageHandler) => {
    if (!subscriptionsRef.current.has(type)) {
      subscriptionsRef.current.set(type, new Set());
    }
    subscriptionsRef.current.get(type)!.add(handler);
    clientRef.current?.on(type, handler);
  }, []);
  
  // Unsubscribe from message type
  const unsubscribe = useCallback((type: MessageType, handler: MessageHandler) => {
    subscriptionsRef.current.get(type)?.delete(handler);
  }, []);
  
  return {
    status,
    isConnected: status === 'connected',
    error,
    send,
    connect,
    disconnect,
    subscribe,
    unsubscribe
  };
}

/**
 * Hook to subscribe to specific message types
 */
export function useWebSocketMessage(
  type: MessageType,
  handler: (message: WebSocketMessage) => void,
  deps: React.DependencyList = []
): void {
  const client = useRef(getWebSocketClient());
  
  useEffect(() => {
    const unsubscribe = client.current.on(type, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

/**
 * Hook to monitor connection status
 */
export function useConnectionStatus(): {
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  isFailed: boolean;
} {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  
  useEffect(() => {
    const client = getWebSocketClient();
    const unsubscribe = client.onStatus(setStatus);
    return unsubscribe;
  }, []);
  
  return {
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    isFailed: status === 'failed'
  };
}

