#!/usr/bin/env node

/**
 * File Lifecycle Hook Registration
 * 
 * Integrates file_lifecycle_manager skill with PostToolUse events.
 * Requires the file_lifecycle_manager skill to be installed.
 */

import PostToolUse from '../../.claude/skills/file_lifecycle_manager/hooks/file-lifecycle-posttooluse.js';

export default PostToolUse;
