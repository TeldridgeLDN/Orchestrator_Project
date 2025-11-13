import { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { readManifest, readSkills, readHealthData, readHealthAlerts } from './lib';
import { ActiveSkillsPanel } from './components/ActiveSkillsPanel';
import { HealthMetricsPanel } from './components/HealthMetricsPanel';
import { HealthAlertsPanel } from './components/HealthAlertsPanel';
import { WorkspaceContainer } from './components/WorkspaceContainer';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useWebSocket, useWebSocketMessage } from './hooks/useWebSocket';

type Layer = 'global' | 'project';

function Dashboard() {
  const [layer, setLayer] = useState<Layer>('global');
  const [data, setData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Initialize WebSocket connection
  const { isConnected } = useWebSocket({ autoConnect: true, debug: true });

  // Function to load data
  const loadData = useCallback(() => {
    const projectRoot = '/Users/tomeldridge/Orchestrator_Project';
    const manifest = readManifest(projectRoot);
    const skills = readSkills(projectRoot);
    const healthData = readHealthData(projectRoot);
    const healthAlerts = readHealthAlerts(projectRoot);
    
    setData({
      layer,
      manifest,
      skills,
      healthData,
      healthAlerts
    });
    setLastUpdate(new Date());
  }, [layer]);

  // Load data when layer changes
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Handle config-change messages
  useWebSocketMessage('config-change', (message) => {
    console.log('Config changed:', message.data);
    // Reload data when config changes
    loadData();
  });
  
  // Handle health-update messages
  useWebSocketMessage('health-update', (message) => {
    console.log('Health updated:', message.data);
    // Update health data only
    if (data) {
      setData({
        ...data,
        healthData: message.data.healthData,
        healthAlerts: message.data.healthAlerts
      });
      setLastUpdate(new Date());
    }
  });
  
  // Handle skill-change messages
  useWebSocketMessage('skill-change', (message) => {
    console.log('Skills changed:', message.data);
    // Update skills only
    if (data) {
      setData({
        ...data,
        skills: message.data.skills
      });
      setLastUpdate(new Date());
    }
  });
  
  // Handle project-change messages
  useWebSocketMessage('project-change', (message) => {
    console.log('Project changed:', message.data);
    // Reload all data when project changes
    loadData();
  });
  
  // Handle group-update messages
  useWebSocketMessage('group-update', (message) => {
    console.log('Groups updated:', message.data);
    // Reload all data when groups change
    loadData();
  });

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setData(null); // Clear data to show loading state
    
    // Simulate brief delay for visual feedback
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Orchestrator Dashboard</h1>
        <div className="dashboard-controls">
          {/* Connection Status Indicator */}
          <ConnectionStatus />
          
          {/* Last Update Timestamp */}
          {lastUpdate && isConnected && (
            <div className="last-update">
              <span className="text-sm text-gray-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="refresh-button"
            aria-label="Refresh dashboard data"
            title="Refresh dashboard data"
          >
            <svg 
              className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="layer-selector">
            <label htmlFor="layer-select">Layer:</label>
            <select 
              id="layer-select"
              value={layer} 
              onChange={(e) => setLayer(e.target.value as Layer)}
              className="layer-dropdown"
            >
              <option value="global">Global</option>
              <option value="project">Project</option>
            </select>
          </div>
        </div>
      </div>
      <div className={`dashboard-content layer-${layer}`}>
        <div className="space-y-6">
          {/* Project Groups Workspace */}
          <WorkspaceContainer />
          
          {/* Health Alerts Panel */}
          <HealthAlertsPanel 
            alerts={data?.healthAlerts || []}
            loading={!data}
            onDismiss={(alertId) => {
              console.log('Dismiss alert:', alertId);
              // In production, this would call API to dismiss the alert
              // Then reload data
              setTimeout(() => {
                const updatedAlerts = data.healthAlerts.map((a: any) =>
                  a.id === alertId ? { ...a, dismissed: true } : a
                );
                setData({ ...data, healthAlerts: updatedAlerts });
              }, 300);
            }}
            onDismissAll={() => {
              console.log('Dismiss all alerts');
              // In production, this would call API to dismiss all alerts
              // Then reload data
              setTimeout(() => {
                const updatedAlerts = data.healthAlerts.map((a: any) => ({ ...a, dismissed: true }));
                setData({ ...data, healthAlerts: updatedAlerts });
              }, 300);
            }}
          />
          
          {/* Health Metrics Panel */}
          <HealthMetricsPanel 
            healthData={data?.healthData || null}
            loading={!data}
          />
          
          {/* Active Skills Panel */}
          <ActiveSkillsPanel 
            skills={data?.skills || null} 
            loading={!data}
          />
          
          {/* Data Preview (temporary - for debugging) */}
          {data && (
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600"><strong>Current Layer:</strong> {layer}</p>
              <p className="text-sm text-gray-600"><strong>Files in Manifest:</strong> {data.manifest?.statistics?.total_files || 0}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

