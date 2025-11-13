import { useState } from 'react';
import type { ProjectHealthData } from '../types';

interface HealthMetricsPanelProps {
  healthData: ProjectHealthData | null;
  loading?: boolean;
}

export function HealthMetricsPanel({ healthData, loading }: HealthMetricsPanelProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  if (!healthData || !healthData.health) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Project Health</h2>
        <div className="text-gray-500 text-center py-8">
          <p>No health data available</p>
          <p className="text-sm mt-2">Run <code className="bg-gray-100 px-2 py-1 rounded">diet103 health --update</code> to calculate health score</p>
        </div>
      </div>
    );
  }
  
  const { health, recommendations } = healthData;
  const score = health.score;
  
  // Determine color class based on score
  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 51) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getHealthBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 51) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };
  
  const getHealthLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 51) return 'Needs Attention';
    return 'Critical Issues';
  };
  
  const getHealthIcon = (score: number): string => {
    if (score >= 80) return '✓';
    if (score >= 51) return '⚠';
    return '✗';
  };
  
  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
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
  
  const colorClass = getHealthColor(score);
  const bgColorClass = getHealthBgColor(score);
  const label = getHealthLabel(score);
  const icon = getHealthIcon(score);
  
  // Top 3 recommendations for display
  const topRecommendations = recommendations.slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Project Health</h2>
        {health.timestamp && (
          <p className="text-sm text-gray-500 mt-1">
            Last checked: {formatTimestamp(health.timestamp)}
          </p>
        )}
      </div>
      
      {/* Main Health Score */}
      <div className={`p-6 border-b border-gray-200 ${bgColorClass} border-2`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${colorClass}`}>
                {icon} {score}
              </span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <p className={`text-lg font-medium mt-2 ${colorClass}`}>{label}</p>
          </div>
          
          {/* Component Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {showBreakdown ? 'Hide' : 'Show'} Breakdown
          </button>
        </div>
      </div>
      
      {/* Component Breakdown (Expandable) */}
      {showBreakdown && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Component Scores
          </h3>
          <div className="space-y-4">
            {Object.entries(health.components).map(([componentName, component]) => (
              <div key={componentName} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {componentName}
                  </span>
                  <span className={`text-sm font-semibold ${getHealthColor(component.score)}`}>
                    {component.score}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      component.score >= 80 ? 'bg-green-500' :
                      component.score >= 51 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${component.score}%` }}
                  ></div>
                </div>
                
                {/* Component Details */}
                {component.details && component.details.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1 mt-2">
                    {component.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">→</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          
          {/* Weight Information */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Score Weights:</span> Structure (40%), Hooks (30%), Skills (20%), Config (10%)
            </p>
          </div>
        </div>
      )}
      
      {/* Issues Section */}
      {(health.issues.critical.length > 0 || health.issues.warnings.length > 0) && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Issues Detected
          </h3>
          
          {health.issues.critical.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                <span>🔴</span>
                Critical ({health.issues.critical.length})
              </h4>
              <ul className="space-y-1">
                {health.issues.critical.map((issue, idx) => (
                  <li key={idx} className="text-sm text-gray-700 pl-6">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {health.issues.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-600 mb-2 flex items-center gap-2">
                <span>🟡</span>
                Warnings ({health.issues.warnings.length})
              </h4>
              <ul className="space-y-1">
                {health.issues.warnings.map((issue, idx) => (
                  <li key={idx} className="text-sm text-gray-700 pl-6">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Recommendations Section (only if score < 80) */}
      {score < 80 && topRecommendations.length > 0 && (
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Top Recommendations
          </h3>
          <div className="space-y-4">
            {topRecommendations.map((rec, idx) => (
              <div key={rec.id} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg flex-shrink-0">{getSeverityIcon(rec.severity)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {idx + 1}. {rec.enhancedIssue || rec.issue}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {rec.enhancedRecommendation || rec.recommendation}
                    </p>
                    
                    {/* Impact */}
                    {rec.impact > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        📈 Impact: +{rec.impact} health points
                      </p>
                    )}
                    
                    {/* Quick Fix Command */}
                    {rec.autoFixable && rec.command && (
                      <div className="mt-2 bg-gray-50 rounded px-2 py-1">
                        <p className="text-xs text-gray-600 mb-1">⚡ Quick fix:</p>
                        <code className="text-xs font-mono text-gray-800 block overflow-x-auto">
                          {rec.command}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recommendations.length > 3 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              + {recommendations.length - 3} more recommendation{recommendations.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
      
      {/* Healthy Project Message */}
      {score >= 80 && (
        <div className="p-6">
          <div className="text-center py-4">
            <span className="text-4xl">✅</span>
            <p className="text-lg font-medium text-green-600 mt-2">Excellent!</p>
            <p className="text-sm text-gray-600 mt-1">Your project is in great health!</p>
          </div>
        </div>
      )}
    </div>
  );
}

