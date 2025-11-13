# diet103 Template Customization Guide

This guide shows how to customize the diet103 repair templates for organization-specific needs.

## 📋 Table of Contents

1. [Understanding Templates](#understanding-templates)
2. [Template Variables](#template-variables)
3. [Customization Examples](#customization-examples)
4. [Organization-Wide Defaults](#organization-wide-defaults)
5. [Custom Template Creation](#custom-template-creation)
6. [Advanced Patterns](#advanced-patterns)

---

## Understanding Templates

The diet103 repair system uses templates defined in `lib/utils/diet103-repair.js`. Each template can contain variables in the format `{{VARIABLE_NAME}}`.

### Current Templates

Located in `TEMPLATES` constant in `lib/utils/diet103-repair.js`:

- **CLAUDE_MD** - Project overview document
- **METADATA_JSON** - Project metadata
- **SKILL_RULES_JSON** - Skill activation rules
- **README_MD** - Infrastructure documentation
- **USER_PROMPT_SUBMIT_HOOK** - Pre-prompt processing hook
- **POST_TOOL_USE_HOOK** - Post-tool processing hook

---

## Template Variables

### Built-in Variables

These are automatically provided by the repair system:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{PROJECT_NAME}}` | Directory name | `Orchestrator_Project` |
| `{{PROJECT_ID}}` | Sanitized identifier | `orchestrator-project` |
| `{{PROJECT_DESCRIPTION}}` | Brief description | `diet103-compliant project` |
| `{{CREATED_DATE}}` | ISO 8601 timestamp | `2025-11-10T08:20:08.901Z` |
| `{{SKILLS_DESCRIPTION}}` | Skills summary | `No skills configured yet` |

### Custom Variables

You can provide custom variables when calling repair functions:

```javascript
import { repairDiet103Infrastructure } from './lib/utils/diet103-repair.js';

await repairDiet103Infrastructure(projectPath, {
  variables: {
    PROJECT_NAME: 'My Custom Name',
    PROJECT_DESCRIPTION: 'Advanced AI-powered system',
    ORGANIZATION: 'Acme Corp',
    TEAM_NAME: 'AI Platform Team',
    LICENSE: 'MIT',
    REPOSITORY_URL: 'https://github.com/acme/project'
  }
});
```

---

## Customization Examples

### Example 1: Corporate Branding

**Customize Claude.md with corporate branding:**

```javascript
// In lib/utils/diet103-repair.js, modify CLAUDE_MD template:

const TEMPLATES = {
  CLAUDE_MD: `# {{PROJECT_NAME}}

## {{ORGANIZATION}} - {{TEAM_NAME}}

### Project Overview
This project follows diet103 1.2.0 specification for Claude Code integration.

**Created:** {{CREATED_DATE}}
**Owner:** {{TEAM_NAME}}
**License:** {{LICENSE}}
**Repository:** {{REPOSITORY_URL}}

### Skills
{{SKILLS_DESCRIPTION}}

### Development Guidelines
- Follow {{ORGANIZATION}} coding standards
- Follow diet103 conventions
- Keep hooks executable
- Maintain metadata.json accuracy

### Support
For questions, contact: {{TEAM_NAME}} at {{SUPPORT_EMAIL}}

---
© {{YEAR}} {{ORGANIZATION}}. All rights reserved.
`,
  // ... rest of templates
};
```

**Usage:**

```bash
node bin/diet103.js validate . --repair
# Or with custom script:
```

```javascript
await repairDiet103Infrastructure(projectPath, {
  variables: {
    ORGANIZATION: 'Acme Corporation',
    TEAM_NAME: 'AI Development Team',
    LICENSE: 'MIT',
    REPOSITORY_URL: 'https://github.com/acme/my-project',
    SUPPORT_EMAIL: 'ai-team@acme.com',
    YEAR: new Date().getFullYear().toString()
  }
});
```

---

### Example 2: Specialized Hooks

**Add organization-specific hook templates:**

```javascript
const TEMPLATES = {
  // ... existing templates ...
  
  USER_PROMPT_SUBMIT_HOOK: `#!/usr/bin/env node

/**
 * UserPromptSubmit Hook - {{ORGANIZATION}} Version
 * 
 * Triggered when user submits a prompt to Claude.
 * 
 * Organization-specific features:
 * - Compliance checking
 * - Audit logging
 * - Context injection
 */

import { logAuditEvent } from '{{AUDIT_LIBRARY}}';

export default async function UserPromptSubmit(context) {
  // Log for compliance
  await logAuditEvent({
    type: 'prompt_submitted',
    user: context.user,
    project: '{{PROJECT_ID}}',
    timestamp: new Date().toISOString()
  });
  
  // Inject organization context
  const orgContext = {
    organization: '{{ORGANIZATION}}',
    team: '{{TEAM_NAME}}',
    project: '{{PROJECT_NAME}}'
  };
  
  return {
    ...context,
    additionalContext: orgContext
  };
}
`,

  POST_TOOL_USE_HOOK: `#!/usr/bin/env node

/**
 * PostToolUse Hook - {{ORGANIZATION}} Version
 * 
 * Post-processes tool usage for compliance and tracking.
 */

import { trackToolUsage, checkCompliance } from '{{AUDIT_LIBRARY}}';

export default async function PostToolUse(context) {
  // Track tool usage for analytics
  await trackToolUsage({
    tool: context.tool,
    project: '{{PROJECT_ID}}',
    timestamp: new Date().toISOString()
  });
  
  // Check compliance if file was modified
  if (context.tool === 'edit' && context.result.success) {
    await checkCompliance(context.result.filePath);
  }
  
  return null;
}
`
};
```

---

### Example 3: Team-Specific metadata.json

**Add team-specific fields to metadata.json:**

```javascript
const TEMPLATES = {
  METADATA_JSON: {
    project_id: '{{PROJECT_ID}}',
    version: '0.1.0',
    description: '{{PROJECT_DESCRIPTION}}',
    skills: [],
    created: '{{CREATED_DATE}}',
    diet103_version: '1.2.0',
    tags: [],
    
    // Organization-specific fields
    organization: '{{ORGANIZATION}}',
    team: '{{TEAM_NAME}}',
    repository: '{{REPOSITORY_URL}}',
    license: '{{LICENSE}}',
    
    compliance: {
      sox_compliant: true,
      gdpr_compliant: true,
      audit_enabled: true
    },
    
    contacts: {
      owner: '{{OWNER_EMAIL}}',
      team: '{{TEAM_EMAIL}}',
      support: '{{SUPPORT_EMAIL}}'
    }
  }
};
```

---

## Organization-Wide Defaults

### Creating a Configuration File

**1. Create organization config:**

```javascript
// org-config.js
export const ORG_DEFAULTS = {
  ORGANIZATION: 'Acme Corporation',
  TEAM_NAME: 'AI Development Team',
  LICENSE: 'MIT',
  SUPPORT_EMAIL: 'ai-team@acme.com',
  AUDIT_LIBRARY: '@acme/audit-tools',
  REPOSITORY_BASE: 'https://github.com/acme',
  
  // Template overrides
  templates: {
    CLAUDE_MD: `# {{PROJECT_NAME}} - {{ORGANIZATION}}
    
... custom template ...
`
  }
};
```

**2. Modify repair function to use org defaults:**

```javascript
// lib/utils/diet103-repair.js
import { ORG_DEFAULTS } from '../org-config.js';

export async function repairDiet103Infrastructure(projectPath, options = {}) {
  const { installImportant = true, variables = {} } = options;
  
  // Merge org defaults with provided variables
  const templateVars = {
    ...ORG_DEFAULTS, // Organization defaults
    PROJECT_NAME: path.basename(projectPath),
    PROJECT_ID: path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    PROJECT_DESCRIPTION: `diet103-compliant project`,
    CREATED_DATE: new Date().toISOString(),
    SKILLS_DESCRIPTION: 'No skills configured yet',
    REPOSITORY_URL: `${ORG_DEFAULTS.REPOSITORY_BASE}/${path.basename(projectPath)}`,
    ...variables // User-provided overrides
  };
  
  // ... rest of repair logic
}
```

---

## Custom Template Creation

### Step-by-Step: Create Organization Template

**1. Fork the diet103-repair.js:**

```bash
cp lib/utils/diet103-repair.js lib/utils/diet103-repair-acme.js
```

**2. Customize templates:**

```javascript
// lib/utils/diet103-repair-acme.js

const ACME_TEMPLATES = {
  CLAUDE_MD: `# {{PROJECT_NAME}}

## 🏢 Acme Corporation - {{TEAM_NAME}}

### Project Overview
Enterprise-grade AI system following diet103 1.2.0 specification.

**📅 Created:** {{CREATED_DATE}}
**👥 Team:** {{TEAM_NAME}}
**📜 License:** {{LICENSE}}
**🔗 Repository:** {{REPOSITORY_URL}}

### 🎯 Skills & Capabilities
{{SKILLS_DESCRIPTION}}

### 📋 Compliance Status
- ✅ SOX Compliant
- ✅ GDPR Compliant
- ✅ Audit Trail Enabled

### 👨‍💻 Development Guidelines

#### Code Standards
- Follow Acme TypeScript Style Guide
- Maintain 80%+ test coverage
- Use conventional commits
- Document all public APIs

#### diet103 Conventions
- Keep hooks executable
- Validate infrastructure weekly
- Update metadata.json on major changes

#### Security
- Never commit secrets
- Use Acme Vault for credentials
- Enable MFA for all tools
- Review dependencies monthly

### 📞 Support & Contacts

- **Team Lead:** {{TEAM_LEAD_EMAIL}}
- **Support:** {{SUPPORT_EMAIL}}
- **Security:** security@acme.com
- **On-call:** Use PagerDuty

### 📚 Resources

- [Acme Dev Portal](https://dev.acme.com)
- [diet103 Docs](https://diet103.dev)
- [Team Wiki]({{WIKI_URL}})

---
© ${new Date().getFullYear()} Acme Corporation. Confidential.
`,

  // ... rest of customized templates
};

// Export custom repair function
export async function repairAcmeInfrastructure(projectPath, options = {}) {
  // Use ACME_TEMPLATES instead of TEMPLATES
  // ... implementation
}
```

**3. Create custom CLI command:**

```javascript
// bin/diet103-acme.js
#!/usr/bin/env node

import { Command } from 'commander';
import { validateCommand } from '../lib/commands/validate.js';
import { repairAcmeInfrastructure } from '../lib/utils/diet103-repair-acme.js';

const program = new Command();

program
  .name('diet103-acme')
  .description('Acme Corporation diet103 validator')
  .version('1.0.0');

program
  .command('validate [path]')
  .option('-r, --repair', 'Repair with Acme templates')
  .action(async (path, options) => {
    if (options.repair) {
      await repairAcmeInfrastructure(path || process.cwd());
    }
    await validateCommand(path, options);
  });

program.parse();
```

---

## Advanced Patterns

### Pattern 1: Dynamic Template Selection

```javascript
// lib/utils/template-selector.js

export function selectTemplateSet(projectType) {
  const templates = {
    'web-app': WEB_APP_TEMPLATES,
    'api-service': API_TEMPLATES,
    'ml-model': ML_TEMPLATES,
    'documentation': DOCS_TEMPLATES,
    'default': DEFAULT_TEMPLATES
  };
  
  return templates[projectType] || templates.default;
}

// Usage in repair:
const templateSet = selectTemplateSet(metadata.project_type);
```

### Pattern 2: Conditional Content

```javascript
const TEMPLATES = {
  CLAUDE_MD: `# {{PROJECT_NAME}}

{{#if PRIVATE}}
⚠️ **CONFIDENTIAL** - Internal Use Only
{{/if}}

{{#if SOX_COMPLIANT}}
### Compliance
This project is SOX compliant and subject to audit.
{{/if}}

### Skills
{{SKILLS_DESCRIPTION}}
`
};

// Implement simple template engine or use handlebars
```

### Pattern 3: Environment-Specific Templates

```javascript
// lib/utils/environment-templates.js

export const ENV_TEMPLATES = {
  development: {
    CLAUDE_MD: `# {{PROJECT_NAME}} [DEV]
    
⚠️ Development Environment - Experimental Features Enabled
...
`,
  },
  
  production: {
    CLAUDE_MD: `# {{PROJECT_NAME}} [PROD]
    
✅ Production Environment - Stable Release
...
`,
  }
};

// Select based on NODE_ENV
const templates = ENV_TEMPLATES[process.env.NODE_ENV] || ENV_TEMPLATES.development;
```

---

## Testing Custom Templates

```javascript
// test/custom-templates.test.js

import { describe, it, expect } from 'vitest';
import { repairAcmeInfrastructure } from '../lib/utils/diet103-repair-acme.js';

describe('Acme Custom Templates', () => {
  it('should include organization branding', async () => {
    const result = await repairAcmeInfrastructure('/tmp/test-project');
    
    const claudeMd = fs.readFileSync('/tmp/test-project/.claude/Claude.md', 'utf8');
    
    expect(claudeMd).toContain('Acme Corporation');
    expect(claudeMd).toContain('AI Development Team');
    expect(claudeMd).toContain('© 2025 Acme Corporation');
  });
  
  it('should include compliance information', async () => {
    const result = await repairAcmeInfrastructure('/tmp/test-project');
    
    const metadata = JSON.parse(
      fs.readFileSync('/tmp/test-project/.claude/metadata.json', 'utf8')
    );
    
    expect(metadata.compliance).toBeDefined();
    expect(metadata.compliance.sox_compliant).toBe(true);
  });
});
```

---

## Best Practices

### ✅ DO:
- Keep templates modular and readable
- Document all custom variables
- Version control your custom templates
- Test templates thoroughly
- Provide fallback values for optional variables
- Use meaningful variable names

### ❌ DON'T:
- Hardcode sensitive information in templates
- Make templates overly complex
- Remove required diet103 fields
- Break diet103 specification compliance
- Forget to update tests when changing templates

---

## Migration Guide

### Migrating from Default to Custom Templates

**Step 1: Backup existing templates**
```bash
cp lib/utils/diet103-repair.js lib/utils/diet103-repair.backup.js
```

**Step 2: Create organization templates**
```bash
cp lib/utils/diet103-repair.js lib/utils/diet103-repair-custom.js
# Edit diet103-repair-custom.js with your customizations
```

**Step 3: Test custom templates**
```bash
npm test -- lib/utils/__tests__/diet103-repair.test.js
```

**Step 4: Deploy gradually**
```bash
# Test on non-critical projects first
node bin/diet103.js validate ./test-project --repair

# Then roll out to production projects
```

---

## Examples Repository

See the `examples/custom-templates/` directory for complete working examples:

- `examples/custom-templates/corporate/` - Corporate branding
- `examples/custom-templates/startup/` - Lean startup templates
- `examples/custom-templates/enterprise/` - Enterprise with compliance
- `examples/custom-templates/open-source/` - Open source project templates

---

## Support

For help customizing templates:

1. Check the [diet103 documentation](https://diet103.dev)
2. Review existing customization examples
3. Test thoroughly before deploying
4. Share your templates with the community!

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0

