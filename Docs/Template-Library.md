# Template Library

A personal template library system for organizing, managing, and reusing project templates locally.

## Overview

The Template Library provides a simple way to:
- Store and organize project templates locally
- Search templates by name, category, or tags
- Install templates with variable substitution
- Create new templates from existing directories

This is a **single-user system** designed for personal productivity, not a marketplace.

## Features

### Core Features
- **Local Storage**: All templates stored in `.orchestrator/templates/`
- **Simple Registry**: Single JSON file (`.orchestrator/template-library.json`)
- **Basic Metadata**: Name, description, category, tags, version
- **Search**: Filter by text, category, or tags
- **Installation**: Copy templates with variable substitution
- **Creation**: Turn any directory into a reusable template

### Variable Substitution

Templates support variable substitution using `{{VARIABLE_NAME}}` syntax:

```markdown
# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}
```

When installing, provide variables:
```javascript
variables: {
  PROJECT_NAME: 'My Awesome Project',
  PROJECT_DESCRIPTION: 'A great project'
}
```

## Getting Started

### 1. Initialize Library

```javascript
import { initializeLibrary } from './lib/utils/template-library.js';

await initializeLibrary('/path/to/project');
```

This creates:
- `.orchestrator/template-library.json` - Registry file
- `.orchestrator/templates/` - Templates directory
- Default categories (web, api, cli, data, automation, other)

### 2. Add Templates

#### Manually Add Template

```javascript
import { addTemplate } from './lib/utils/template-library.js';

await addTemplate(projectPath, {
  id: 'express-api',
  name: 'Express REST API',
  description: 'A basic Express.js REST API template',
  category: 'api',
  tags: ['express', 'rest', 'backend'],
  version: '1.0.0',
  location: './templates/express-api',
  requirements: {
    orchestratorVersion: '^1.0.0',
    dependencies: [
      { type: 'npm', name: 'express', version: '^4.18.0' }
    ]
  }
});
```

#### Create from Directory

```javascript
import { createTemplateFromDirectory } from './lib/utils/template-library.js';

await createTemplateFromDirectory(
  projectPath,
  '/path/to/existing/project',
  {
    name: 'My Template',
    description: 'Template created from existing project',
    category: 'web',
    tags: ['react', 'frontend'],
    version: '1.0.0'
  }
);
```

### 3. List and Search

#### List All Templates

```javascript
import { listTemplates } from './lib/utils/template-library.js';

const templates = await listTemplates(projectPath);
console.log(templates);
```

#### Search Templates

```javascript
import { searchTemplates } from './lib/utils/template-library.js';

// Search by text
const results = await searchTemplates(projectPath, {
  text: 'react'
});

// Search by category
const apiTemplates = await searchTemplates(projectPath, {
  category: 'api'
});

// Search by tags (AND logic)
const backendTemplates = await searchTemplates(projectPath, {
  tags: ['backend', 'express']
});

// Combine filters
const filtered = await searchTemplates(projectPath, {
  text: 'api',
  category: 'api',
  tags: ['rest']
});
```

### 4. Install Templates

```javascript
import { installTemplate } from './lib/utils/template-library.js';

const result = await installTemplate(
  projectPath,
  'express-api',      // Template ID
  './new-project',    // Destination
  {
    variables: {      // Optional variables
      PROJECT_NAME: 'My API',
      PORT: '3000',
      AUTHOR: 'Your Name'
    },
    overwrite: false  // Optional: allow overwriting
  }
);
```

## Template Structure

### Registry Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-01T00:00:00Z",
  "templates": {
    "template-id": {
      "id": "template-id",
      "name": "Template Name",
      "description": "Brief description",
      "category": "web",
      "tags": ["tag1", "tag2"],
      "version": "1.0.0",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "location": ".orchestrator/templates/template-id",
      "requirements": {
        "orchestratorVersion": "^1.0.0",
        "dependencies": [
          {
            "type": "npm",
            "name": "package-name",
            "version": "^1.0.0"
          }
        ]
      }
    }
  },
  "categories": [
    {
      "id": "web",
      "name": "Web Development",
      "description": "Web application templates"
    }
  ]
}
```

### Template Directory Structure

```
.orchestrator/
├── template-library.json         # Registry file
└── templates/                    # Templates directory
    ├── express-api/              # Template files
    │   ├── package.json
    │   ├── README.md
    │   └── src/
    │       └── index.js
    └── react-app/                # Another template
        ├── package.json
        └── src/
            └── App.js
```

## API Reference

### Core Functions

#### `initializeLibrary(projectPath)`
Initialize a new template library.

**Parameters:**
- `projectPath` (string): Project root path

**Returns:** Promise<{success, message, registryPath}>

---

#### `addTemplate(projectPath, template)`
Add a template to the library.

**Parameters:**
- `projectPath` (string): Project root path
- `template` (object): Template metadata

**Returns:** Promise<{success, message, templateId}>

---

#### `removeTemplate(projectPath, templateId)`
Remove a template from the library.

**Parameters:**
- `projectPath` (string): Project root path
- `templateId` (string): Template ID

**Returns:** Promise<{success, message}>

---

#### `getTemplate(projectPath, templateId)`
Get a specific template by ID.

**Parameters:**
- `projectPath` (string): Project root path
- `templateId` (string): Template ID

**Returns:** Promise<Template|null>

---

#### `listTemplates(projectPath)`
List all templates.

**Parameters:**
- `projectPath` (string): Project root path

**Returns:** Promise<Template[]>

---

#### `searchTemplates(projectPath, query)`
Search templates by criteria.

**Parameters:**
- `projectPath` (string): Project root path
- `query` (object): Search criteria
  - `text` (string, optional): Search text
  - `category` (string, optional): Category filter
  - `tags` (string[], optional): Tag filters (AND logic)

**Returns:** Promise<Template[]>

---

#### `installTemplate(projectPath, templateId, destination, options)`
Install a template to destination.

**Parameters:**
- `projectPath` (string): Project root path
- `templateId` (string): Template ID
- `destination` (string): Destination directory
- `options` (object, optional):
  - `variables` (object): Variable substitutions
  - `overwrite` (boolean): Allow overwriting

**Returns:** Promise<{success, message, location}>

---

#### `createTemplateFromDirectory(projectPath, sourcePath, metadata)`
Create a template from an existing directory.

**Parameters:**
- `projectPath` (string): Project root path
- `sourcePath` (string): Source directory
- `metadata` (object): Template metadata

**Returns:** Promise<{success, message, templateId}>

## Command Line Interface

### Commands

```bash
# Initialize library
node lib/commands/template/index.js init

# List all templates
node lib/commands/template/index.js list

# List templates by category
node lib/commands/template/index.js list --category=api

# Search templates
node lib/commands/template/index.js search --text="react"

# Show template details
node lib/commands/template/index.js show express-api

# Install template
node lib/commands/template/index.js install \
  --template=express-api \
  --destination=./new-project \
  --var PROJECT_NAME="My API" \
  --var PORT=3000

# Create template from directory
node lib/commands/template/index.js create \
  --source=./my-project \
  --name="My Template" \
  --description="A custom template" \
  --category=web \
  --tags=react,frontend

# Remove template
node lib/commands/template/index.js remove express-api --yes

# List categories
node lib/commands/template/index.js categories
```

## Best Practices

### Template Organization

1. **Use Clear Names**: Make template names descriptive
2. **Categorize Properly**: Choose the right category
3. **Add Relevant Tags**: Use tags for better searchability
4. **Document Requirements**: List all dependencies
5. **Version Templates**: Use semantic versioning

### Template Creation

1. **Clean Before Creating**: Remove build artifacts, node_modules, etc.
2. **Use Variables**: Make templates reusable with `{{VARIABLES}}`
3. **Include Documentation**: Add README with setup instructions
4. **Test Templates**: Install and verify before sharing
5. **Keep Updated**: Maintain templates as best practices evolve

### Variable Usage

Common variables to use in templates:
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{AUTHOR}}` - Author name
- `{{AUTHOR_EMAIL}}` - Author email
- `{{LICENSE}}` - License type
- `{{VERSION}}` - Initial version
- `{{PORT}}` - Server port
- `{{DATABASE_URL}}` - Database connection

## Examples

See `examples/template-library-example.js` for a complete example demonstrating all features.

## Related Files

- Implementation: `lib/utils/template-library.js`
- Schema: `lib/schemas/template-library-schema.json`
- Commands: `lib/commands/template/index.js`
- Tests: `lib/utils/__tests__/template-library.test.js`
- Example: `examples/template-library-example.js`

## Limitations

- **Single User**: Designed for personal use only
- **Local Only**: No cloud/remote sync
- **No Marketplace**: No discovery, ratings, or downloads
- **Simple Versioning**: Only tracks latest version
- **Basic Search**: Text and tag matching only

## Future Enhancements

Potential improvements for future versions:
- Template preview/scaffolding wizard
- Interactive variable prompts
- Template dependencies
- Import/export templates
- Template validation/linting
- Git integration for template versioning

