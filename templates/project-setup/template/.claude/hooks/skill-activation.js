#!/usr/bin/env node

/**
 * Skill Auto-Activation Hook (diet103 pattern)
 * 
 * Analyzes user prompts and file context to automatically suggest relevant skills.
 * Based on: https://github.com/diet103/claude-code-infrastructure-showcase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function UserPromptSubmit(context) {
  try {
    const { prompt, files } = context;
    
    // Load skill-rules.json
    const rulesPath = path.join(__dirname, '..', 'skill-rules.json');
    if (!fs.existsSync(rulesPath)) {
      return null; // No rules, proceed normally
    }
    
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const matchedSkills = new Set();
    
    // Check trigger phrases in prompt
    const promptLower = prompt.toLowerCase();
    
    for (const rule of rules.rules) {
      if (!rule.auto_activate) continue;
      
      const matched = rule.trigger_phrases.some(phrase => {
        const phraseLower = phrase.toLowerCase();
        return rules.global_settings.partial_match
          ? promptLower.includes(phraseLower)
          : promptLower === phraseLower;
      });
      
      if (matched) {
        matchedSkills.add({
          name: rule.skill,
          priority: rule.priority,
          description: rule.description
        });
      }
    }
    
    // Check file context patterns
    if (files && files.length > 0) {
      for (const rule of rules.rules) {
        if (rule.file_patterns) {
          const fileMatched = files.some(file =>
            rule.file_patterns.some(pattern => file.path.includes(pattern))
          );
          
          if (fileMatched) {
            matchedSkills.add({
              name: rule.skill,
              priority: rule.priority || 'low',
              description: rule.description
            });
          }
        }
      }
    }
    
    // If skills matched, inject suggestion
    if (matchedSkills.size > 0) {
      const sortedSkills = Array.from(matchedSkills).sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
      
      const topSkill = sortedSkills[0];
      const skillPath = path.join(__dirname, '..', 'skills', topSkill.name, 'skill.md');
      
      // Check if skill file exists
      if (fs.existsSync(skillPath)) {
        // Add skill suggestion to context
        const suggestion = `\n\n[Auto-detected relevant skill: ${topSkill.name}]\n${topSkill.description}\nSkill available at: .claude/skills/${topSkill.name}/skill.md`;
        
        return {
          ...context,
          prompt: prompt + suggestion
        };
      }
    }
    
    return null; // No changes
    
  } catch (error) {
    console.error('[Skill Activation Hook] Error:', error.message);
    return null; // Proceed without modifications on error
  }
}

