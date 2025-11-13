/**
 * Connection Status Component
 * 
 * Displays the current WebSocket connection status with visual indicators
 */

import { useConnectionStatus } from '../hooks/useWebSocket';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { status, isConnected, isReconnecting, isFailed } = useConnectionStatus();
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'reconnecting':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  const getStatusIcon = () => {
    if (isConnected) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      );
    }
    
    if (isReconnecting) {
      return (
        <svg 
          className="spinning" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      );
    }
    
    if (isFailed) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      );
    }
    
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    );
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={`connection-status status-${status}`} data-color={getStatusColor()}>
      <div className="status-indicator">
        {getStatusIcon()}
      </div>
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
}

