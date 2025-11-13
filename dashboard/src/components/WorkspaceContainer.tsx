import { useState, useEffect } from 'react';
import { WorkspacePanel, ProjectGroup } from './WorkspacePanel';
import { GroupModal } from './GroupModal';
import {
  loadGroupData,
  createGroup as apiCreateGroup,
  updateGroup as apiUpdateGroup,
  deleteGroup as apiDeleteGroup,
  setActiveGroup as apiSetActiveGroup,
  switchProject as apiSwitchProject
} from '../groupDataLoader';
import './WorkspaceContainer.css';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  groupName?: string;
  groupDescription?: string;
  projectCount?: number;
};

export function WorkspaceContainer() {
  const [groups, setGroups] = useState<Record<string, ProjectGroup>>({});
  const [currentProject, setCurrentProject] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create'
  });
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = () => {
    setLoading(true);
    try {
      const data = loadGroupData();
      setGroups(data.groups);
      setCurrentProject(data.currentProject);
      setActiveGroup(data.activeGroup);
    } catch (error) {
      showNotification('Failed to load workspace data', 'error');
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const handleCreateGroup = () => {
    setModalState({
      isOpen: true,
      mode: 'create'
    });
  };

  const handleEditGroup = (groupName: string) => {
    const group = groups[groupName];
    if (group) {
      setModalState({
        isOpen: true,
        mode: 'edit',
        groupName: group.name,
        groupDescription: group.description
      });
    }
  };

  const handleDeleteGroup = (groupName: string) => {
    const group = groups[groupName];
    if (group) {
      setModalState({
        isOpen: true,
        mode: 'delete',
        groupName: group.name,
        groupDescription: group.description,
        projectCount: group.projects.length
      });
    }
  };

  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      mode: 'create'
    });
  };

  const handleModalSubmit = async (data: { name?: string; description?: string }) => {
    setOperationInProgress(true);

    try {
      switch (modalState.mode) {
        case 'create':
          if (data.name && data.description !== undefined) {
            await apiCreateGroup(data.name, data.description);
            
            // Optimistically update UI
            const newGroup: ProjectGroup = {
              name: data.name,
              description: data.description,
              createdAt: new Date().toISOString(),
              projects: [],
              sharedConfig: {
                skills: [],
                hooks: {}
              }
            };
            setGroups(prev => ({ ...prev, [data.name]: newGroup }));
            
            showNotification(`Group "${data.name}" created successfully`, 'success');
          }
          break;

        case 'edit':
          if (modalState.groupName && data.description !== undefined) {
            await apiUpdateGroup(modalState.groupName, data.description);
            
            // Optimistically update UI
            setGroups(prev => ({
              ...prev,
              [modalState.groupName!]: {
                ...prev[modalState.groupName!],
                description: data.description!,
                updatedAt: new Date().toISOString()
              }
            }));
            
            showNotification(`Group "${modalState.groupName}" updated successfully`, 'success');
          }
          break;

        case 'delete':
          if (modalState.groupName) {
            await apiDeleteGroup(modalState.groupName);
            
            // Optimistically update UI
            setGroups(prev => {
              const newGroups = { ...prev };
              delete newGroups[modalState.groupName!];
              return newGroups;
            });
            
            // Clear active group if it was deleted
            if (activeGroup === modalState.groupName) {
              setActiveGroup(null);
            }
            
            showNotification(`Group "${modalState.groupName}" deleted successfully`, 'success');
          }
          break;
      }

      handleModalClose();
      
      // Reload data to ensure consistency with backend
      setTimeout(loadData, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      showNotification(errorMessage, 'error');
      console.error('Operation error:', error);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleSwitchProject = async (projectName: string) => {
    if (projectName === currentProject) {
      return;
    }

    try {
      await apiSwitchProject(projectName);
      setCurrentProject(projectName);
      showNotification(`Switched to project "${projectName}"`, 'success');
    } catch (error) {
      showNotification('Failed to switch project', 'error');
      console.error('Error switching project:', error);
    }
  };

  const handleSwitchGroup = async (groupName: string) => {
    if (groupName === activeGroup) {
      return;
    }

    try {
      await apiSetActiveGroup(groupName);
      setActiveGroup(groupName);
      showNotification(`Activated group "${groupName}"`, 'success');
    } catch (error) {
      showNotification('Failed to activate group', 'error');
      console.error('Error activating group:', error);
    }
  };

  return (
    <div className="workspace-container-wrapper">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <WorkspacePanel
        groups={groups}
        currentProject={currentProject}
        activeGroup={activeGroup}
        loading={loading}
        onCreateGroup={handleCreateGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onSwitchProject={handleSwitchProject}
        onSwitchGroup={handleSwitchGroup}
      />

      <GroupModal
        isOpen={modalState.isOpen && !operationInProgress}
        mode={modalState.mode}
        groupName={modalState.groupName}
        groupDescription={modalState.groupDescription}
        projectCount={modalState.projectCount}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />

      {operationInProgress && (
        <div className="operation-overlay">
          <div className="operation-spinner"></div>
        </div>
      )}
    </div>
  );
}


