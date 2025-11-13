import type { FileManifest, Skill, OrchestratorConfig, HookLogEntry, ProjectHealthData, HealthAlert } from './types';

/**
 * Read the file manifest from a project directory
 * @param projectRoot - Path to the project root directory
 * @returns Parsed FileManifest or null if file doesn't exist or is invalid
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readManifest(projectRoot: string): FileManifest | null {
  // Browser stub - would call API in production
  console.log('Loading manifest for:', projectRoot);
  
  // Mock data for demonstration
  return {
    $schema: "https://claude.ai/schemas/file-manifest-v1.json",
    version: "1.0",
    project: "Orchestrator_Project",
    initialized: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    statistics: {
      total_files: 14,
      by_tier: {
        CRITICAL: 7,
        PERMANENT: 6,
        EPHEMERAL: 1,
        ARCHIVED: 0
      },
      pending_archive: 0,
      misplaced: 0
    },
    files: {}
  };
}

/**
 * Read skill information from the skills directory
 * @param projectRoot - Path to the project root directory
 * @returns Array of Skill objects or empty array if directory doesn't exist
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readSkills(projectRoot: string): Skill[] {
  // Browser stub - would call API in production
  console.log('Loading skills for:', projectRoot);
  
  // Mock data for demonstration
  return [
    { name: 'file_lifecycle_manager', status: 'active', path: '/lib/skills/file_lifecycle_manager' },
    { name: 'documentation_enforcer', status: 'active', path: '/lib/skills/documentation_enforcer' }
  ];
}

/**
 * Read hook logs from the logs directory
 * @param projectRoot - Path to the project root directory
 * @param limit - Maximum number of log entries to return (default: 100)
 * @returns Array of HookLogEntry objects or empty array
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readHookLogs(projectRoot: string, limit: number = 100): HookLogEntry[] {
  // Browser stub - would call API in production
  console.log('Loading hook logs for:', projectRoot, 'limit:', limit);
  
  // Mock data for demonstration
  return [];
}

/**
 * Read orchestrator configuration
 * @param projectRoot - Path to the project root directory
 * @returns Parsed config object or null if file doesn't exist or is invalid
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readConfig(projectRoot: string): OrchestratorConfig | null {
  // Browser stub - would call API in production
  console.log('Loading config for:', projectRoot);
  
  // Mock data for demonstration
  return {
    project: 'Orchestrator_Project',
    version: '1.0.0'
  };
}

/**
 * Read project health data
 * @param projectRoot - Path to the project root directory
 * @returns ProjectHealthData with health metrics and recommendations, or null if unavailable
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readHealthData(projectRoot: string): ProjectHealthData | null {
  // Browser stub - would call API in production
  console.log('Loading health data for:', projectRoot);
  
  // Mock data for demonstration - simulate a project with moderate health score
  return {
    health: {
      score: 65,
      timestamp: new Date().toISOString(),
      components: {
        structure: {
          score: 80,
          details: [
            'Critical components: 7/7',
            'Important components: 4/5',
            'Overall completeness: 80%'
          ],
          gaps: {
            important: ['docs']
          }
        },
        hooks: {
          score: 50,
          details: [
            'Hooks present: 2/2',
            'Valid hooks: 1/2'
          ]
        },
        skills: {
          score: 50,
          details: [
            'Configured skills in rules: 2',
            'Skill directories: 2'
          ]
        },
        config: {
          score: 100,
          details: [
            'All required fields present',
            'Valid diet103 version'
          ]
        }
      },
      issues: {
        critical: ['Hooks: Missing or invalid hook files'],
        warnings: ['Structure: Missing docs directory']
      }
    },
    recommendations: [
      {
        id: 'hook-001',
        category: 'hooks',
        severity: 'critical',
        issue: 'Missing UserPromptSubmit.js hook',
        recommendation: 'Create the UserPromptSubmit hook file. This hook runs before each user prompt is processed.',
        impact: 15,
        autoFixable: true,
        command: 'cp lib/templates/hooks/UserPromptSubmit.js .claude/hooks/'
      },
      {
        id: 'struct-006',
        category: 'structure',
        severity: 'medium',
        issue: 'Missing .claude/docs directory',
        recommendation: 'Create the docs directory: mkdir -p .claude/docs',
        impact: 3,
        autoFixable: true,
        command: 'mkdir -p .claude/docs'
      },
      {
        id: 'skill-003',
        category: 'skills',
        severity: 'low',
        issue: 'No skill directories found',
        recommendation: 'Consider creating skills to extend Claude\'s capabilities.',
        impact: 5,
        autoFixable: false
      }
    ],
    lastCheck: new Date().toISOString()
  };
}

/**
 * Read health alerts for a project
 * @param projectRoot - Path to the project root directory
 * @returns Array of HealthAlert objects
 * 
 * Note: This is a browser stub. In production, this would fetch from a backend API.
 */
export function readHealthAlerts(projectRoot: string): HealthAlert[] {
  // Browser stub - would call API in production
  console.log('Loading health alerts for:', projectRoot);
  
  // Mock data for demonstration - simulate active alerts
  return [
    {
      id: 'alert_1731437400_abc123',
      type: 'health',
      severity: 'warning',
      message: '⚡ Project health needs attention (65/100).',
      score: 65,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      dismissed: false
    },
    {
      id: 'alert_1731433800_def456',
      type: 'health_degraded',
      severity: 'warning',
      message: '📉 Project health declined by 15 points (80→65).',
      score: 65,
      previousScore: 80,
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      dismissed: false
    }
  ];
}

