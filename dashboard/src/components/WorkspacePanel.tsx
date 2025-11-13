import { useState } from 'react';
import { ProjectGroup } from '../types';
import './WorkspacePanel.css';

export interface WorkspacePanelProps {
  groups: Record<string, ProjectGroup>;
  currentProject: string;
  activeGroup: string | null;
  loading?: boolean;
  onCreateGroup?: () => void;
  onEditGroup?: (groupName: string) => void;
  onDeleteGroup?: (groupName: string) => void;
  onSwitchProject?: (projectName: string) => void;
  onSwitchGroup?: (groupName: string) => void;
}

export function WorkspacePanel({
  groups,
  currentProject,
  activeGroup,
  loading = false,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onSwitchProject,
  onSwitchGroup
}: WorkspacePanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(Object.keys(groups))
  );

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="workspace-panel">
        <div className="workspace-loading">
          <div className="loading-spinner"></div>
          <p>Loading workspaces...</p>
        </div>
      </div>
    );
  }

  const groupEntries = Object.entries(groups);
  const hasNoGroups = groupEntries.length === 0;

  return (
    <div className="workspace-panel">
      <div className="workspace-header">
        <h2>Project Groups</h2>
        {onCreateGroup && (
          <button
            className="btn-create-group"
            onClick={onCreateGroup}
            title="Create new project group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>New Group</span>
          </button>
        )}
      </div>

      {hasNoGroups ? (
        <div className="workspace-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p>No project groups</p>
          <p className="text-muted">Create a group to organize your projects</p>
          {onCreateGroup && (
            <button className="btn-primary" onClick={onCreateGroup}>
              Create Your First Group
            </button>
          )}
        </div>
      ) : (
        <div className="workspaces-container">
          {groupEntries.map(([groupName, group]) => {
            const isCurrentGroup = group.projects.includes(currentProject);
            const isActiveGroup = activeGroup === groupName;
            const isExpanded = expandedGroups.has(groupName);

            return (
              <div
                key={groupName}
                className={`workspace-group ${isCurrentGroup ? 'current-group' : ''} ${isActiveGroup ? 'active-group' : ''}`}
              >
                <div className="group-header">
                  <button
                    className="group-expand-toggle"
                    onClick={() => toggleGroupExpansion(groupName)}
                    aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className={`chevron ${isExpanded ? 'expanded' : ''}`}
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  <div className="group-info">
                    <h3 className="group-name">
                      {groupName}
                      {isActiveGroup && <span className="badge badge-active">Active</span>}
                    </h3>
                    <p className="group-meta">
                      <span className="project-count">
                        {group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'}
                      </span>
                      {group.description && (
                        <>
                          <span className="separator">•</span>
                          <span className="group-description">{group.description}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="group-actions">
                    {onSwitchGroup && !isActiveGroup && (
                      <button
                        className="btn-icon"
                        onClick={() => onSwitchGroup(groupName)}
                        title="Set as active group"
                        aria-label="Set as active group"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                      </button>
                    )}
                    {onEditGroup && (
                      <button
                        className="btn-icon"
                        onClick={() => onEditGroup(groupName)}
                        title="Edit group"
                        aria-label="Edit group"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    {onDeleteGroup && (
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => onDeleteGroup(groupName)}
                        title="Delete group"
                        aria-label="Delete group"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="group-projects">
                    {group.projects.length === 0 ? (
                      <div className="projects-empty">
                        <p className="text-muted">No projects in this group</p>
                      </div>
                    ) : (
                      <ul className="projects-list">
                        {group.projects.map(projectName => {
                          const isActive = projectName === currentProject;

                          return (
                            <li
                              key={projectName}
                              className={`project-item ${isActive ? 'active-project' : ''}`}
                            >
                              <button
                                className="project-link"
                                onClick={() => onSwitchProject?.(projectName)}
                                disabled={isActive}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                                </svg>
                                <span className="project-name">{projectName}</span>
                                {isActive && <span className="badge badge-sm badge-success">Current</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

