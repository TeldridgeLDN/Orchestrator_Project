/**
 * TypeScript interfaces for Orchestrator data structures
 */

// File Manifest types
export interface FileManifestStatistics {
  total_files: number;
  by_tier: {
    CRITICAL: number;
    PERMANENT: number;
    EPHEMERAL: number;
    ARCHIVED: number;
  };
  pending_archive: number;
  misplaced: number;
}

export interface FileEntry {
  tier: 'CRITICAL' | 'PERMANENT' | 'EPHEMERAL' | 'ARCHIVED';
  status: 'active' | 'archived';
  created: string;
  modified: string;
  added_to_manifest: string;
  protected: boolean;
  size_bytes: number;
  notes?: string;
}

export interface FileManifest {
  $schema: string;
  version: string;
  project: string;
  initialized: string;
  last_updated: string;
  statistics: FileManifestStatistics;
  files: Record<string, FileEntry>;
}

// Skill types
export interface Skill {
  name: string;
  status: 'active' | 'inactive';
  path: string;
  description?: string;
}

// Config types
export interface OrchestratorConfig {
  project?: string;
  version?: string;
  [key: string]: unknown;
}

// Hook log types
export interface HookLogEntry {
  timestamp: string;
  hookName: string;
  status: 'success' | 'error';
  message?: string;
  duration?: number;
}

// Health metrics types
export interface HealthComponentScore {
  score: number;
  details: string[];
  gaps?: {
    critical?: string[];
    important?: string[];
  };
}

export interface HealthMetrics {
  score: number;
  timestamp: string;
  components: {
    structure: HealthComponentScore;
    hooks: HealthComponentScore;
    skills: HealthComponentScore;
    config: HealthComponentScore;
  };
  issues: {
    critical: string[];
    warnings: string[];
  };
}

export interface HealthRecommendation {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  impact: number;
  autoFixable: boolean;
  command?: string;
  enhancedIssue?: string;
  enhancedRecommendation?: string;
}

export interface ProjectHealthData {
  health: HealthMetrics | null;
  recommendations: HealthRecommendation[];
  lastCheck?: string;
}

// Alert types
export interface HealthAlert {
  id: string;
  type: 'health' | 'health_improved' | 'health_degraded';
  severity: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  score: number;
  previousScore?: number;
  timestamp: string;
  dismissed: boolean;
  dismissedAt?: string;
}

// Project Group types
export interface ProjectGroup {
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  projects: string[];
  sharedConfig: {
    skills?: string[];
    hooks?: Record<string, any>;
  };
}

export interface GroupsData {
  groups: Record<string, ProjectGroup>;
  currentProject: string;
  activeGroup: string | null;
}

