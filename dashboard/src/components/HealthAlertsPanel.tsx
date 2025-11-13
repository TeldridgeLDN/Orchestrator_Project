import { useState } from 'react';
import type { HealthAlert } from '../types';

interface HealthAlertsPanelProps {
  alerts: HealthAlert[];
  loading?: boolean;
  onDismiss?: (alertId: string) => void;
  onDismissAll?: () => void;
}

export function HealthAlertsPanel({ alerts, loading, onDismiss, onDismissAll }: HealthAlertsPanelProps) {
  const [dismissing, setDismissing] = useState<string | null>(null);
  
  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  
  if (loading) {
    return null; // Don't show loading state for alerts
  }
  
  if (activeAlerts.length === 0) {
    return null; // Don't show panel if no active alerts
  }
  
  const handleDismiss = async (alertId: string) => {
    setDismissing(alertId);
    if (onDismiss) {
      await onDismiss(alertId);
    }
    setDismissing(null);
  };
  
  const handleDismissAll = async () => {
    setDismissing('all');
    if (onDismissAll) {
      await onDismissAll();
    }
    setDismissing(null);
  };
  
  const getSeverityStyles = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 border-l-yellow-500';
      case 'success':
        return 'bg-green-50 border-green-300 border-l-green-500';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-300 border-l-blue-500';
    }
  };
  
  const getSeverityTextColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'success':
        return 'text-green-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };
  
  const getSeverityButtonColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 hover:text-red-800';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800';
      case 'success':
        return 'text-green-600 hover:text-green-800';
      case 'info':
      default:
        return 'text-blue-600 hover:text-blue-800';
    }
  };
  
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">🔔 Active Alerts</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {activeAlerts.length}
          </span>
        </div>
        {activeAlerts.length > 1 && onDismissAll && (
          <button
            onClick={handleDismissAll}
            disabled={dismissing === 'all'}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dismissing === 'all' ? 'Dismissing...' : 'Dismiss All'}
          </button>
        )}
      </div>
      
      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border-l-4 ${getSeverityStyles(alert.severity)} transition-opacity duration-200 ${
              dismissing === alert.id ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getSeverityTextColor(alert.severity)} whitespace-pre-wrap`}>
                  {alert.message}
                </p>
                
                {/* Alert Metadata */}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatTimestamp(alert.timestamp)}</span>
                  {alert.type && (
                    <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                  )}
                </div>
                
                {/* Score Change Info (for improvement/degradation) */}
                {alert.previousScore !== undefined && (
                  <div className="mt-2 text-xs text-gray-600">
                    Score change: {alert.previousScore} → {alert.score}
                    {alert.previousScore < alert.score && (
                      <span className="text-green-600 font-medium ml-1">
                        (+{alert.score - alert.previousScore})
                      </span>
                    )}
                    {alert.previousScore > alert.score && (
                      <span className="text-red-600 font-medium ml-1">
                        ({alert.score - alert.previousScore})
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Dismiss Button */}
              {onDismiss && (
                <button
                  onClick={() => handleDismiss(alert.id)}
                  disabled={dismissing === alert.id}
                  className={`flex-shrink-0 p-1 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getSeverityButtonColor(alert.severity)}`}
                  aria-label="Dismiss alert"
                  title="Dismiss alert"
                >
                  {dismissing === alert.id ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Info */}
      {activeAlerts.length > 0 && (
        <div className="p-3 bg-gray-50 text-xs text-gray-600 text-center border-t border-gray-200">
          Alerts are generated based on health score changes and can be dismissed once addressed.
        </div>
      )}
    </div>
  );
}

