#!/usr/bin/env node

/**
 * Session Wind-Down Hook
 * 
 * Automatically triggers when user indicates they're ending a session.
 * Orchestrates graceful cleanup and context preservation.
 * 
 * Trigger phrases:
 * - "goodbye"
 * - "wind down"
 * - "end session"
 * - "wrap up"
 * - "finish session"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WINDDOWN_TRIGGERS = [
  'goodbye',
  'wind down',
  'winddown',
  'end session',
  'wrap up',
  'finish session',
  'close session',
  'session complete',
  'done for today',
  'done for now'
];

export default async function UserPromptSubmit(context) {
  try {
    const { prompt } = context;
    const promptLower = prompt.toLowerCase().trim();
    
    // Check if this is a wind-down trigger
    const isWindDown = WINDDOWN_TRIGGERS.some(trigger => {
      // Exact match or starts with trigger
      return promptLower === trigger || 
             promptLower.startsWith(trigger + ' ') ||
             promptLower.startsWith(trigger + ',') ||
             promptLower.startsWith(trigger + '.');
    });
    
    if (!isWindDown) {
      return null; // Not a wind-down, proceed normally
    }
    
    // Inject wind-down agent and instructions
    const agentPath = '.claude/agents/session-cleanup.md';
    
    if (!fs.existsSync(agentPath)) {
      console.warn('[Wind-Down Hook] session-cleanup.md agent not found');
      return null;
    }
    
    const windDownPrompt = `
[🌅 Session Wind-Down Detected]

The user is ending their session. Please activate the session-cleanup agent and guide them through a graceful wind-down process.

@session-cleanup.md

Original message: "${prompt}"

Follow the session wind-down protocol to:
1. Document current progress
2. Save session state
3. Tidy documentation
4. Prepare handoff notes
5. Provide friendly session summary

Be warm and helpful - this is about leaving the project in great shape for the next session.
`;
    
    return {
      ...context,
      prompt: windDownPrompt
    };
    
  } catch (error) {
    console.error('[Wind-Down Hook] Error:', error.message);
    return null;
  }
}

