/**
 * Active Skills Panel Component
 * 
 * Displays active skills in a clean, professional table format.
 * 
 * @example
 * ```tsx
 * <ActiveSkillsPanel 
 *   skills={skills} 
 *   loading={false}
 * />
 * ```
 */

import type { Skill } from '../types';

interface ActiveSkillsPanelProps {
  /** Array of skills to display */
  skills: Skill[] | null;
  /** Loading state indicator */
  loading?: boolean;
}

/**
 * ActiveSkillsPanel - Displays skills in a table format
 * 
 * Features:
 * - Clean table layout with headers
 * - Loading state with spinner
 * - Empty state with helpful message
 * - Hover effects on rows
 * - Responsive design
 * 
 * @param props - Component props
 * @returns Rendered panel component
 */
export function ActiveSkillsPanel({ skills, loading = false }: ActiveSkillsPanelProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Skills</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading skills...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!skills || skills.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Skills</h2>
        <div className="text-center py-8">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
          <p className="mt-4 text-gray-600">No active skills found</p>
          <p className="mt-2 text-sm text-gray-500">
            Skills will appear here when available in the selected layer
          </p>
        </div>
      </div>
    );
  }

  // Table with skills data
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Active Skills</h2>
        <p className="mt-1 text-sm text-gray-600">
          {skills.length} skill{skills.length !== 1 ? 's' : ''} loaded
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Skill Name
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {skills.map((skill, index) => (
              <tr 
                key={`${skill.name}-${index}`}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {skill.name}
                  </div>
                  {skill.description && (
                    <div className="text-sm text-gray-500">
                      {skill.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${skill.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}
                  >
                    {skill.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {skill.path}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActiveSkillsPanel;

