# Scenario Manager Skill

**Version:** 1.0.0  
**Auto-Activation:** Triggers on scenario-related phrases

---

## Purpose

This skill helps you create, validate, and manage development scenarios - 
reusable templates for common project patterns.

---

## When This Skill Activates

This skill auto-activates when you say phrases like:
- "create scenario"
- "new scenario"
- "validate scenario"
- "list scenarios"

---

## What You Can Do

### Create a New Scenario

```
"Create a scenario for user authentication"
```

I'll help you scaffold a scenario with:
- Metadata (name, description, tags)
- File templates
- Configuration variables
- Validation rules

### List Available Scenarios

```
"Show me available scenarios"
```

I'll display all scenarios in your project.

### Validate a Scenario

```
"Validate the auth scenario"
```

I'll check that the scenario follows the correct schema.

### Generate from Scenario

```
"Generate authentication boilerplate using the auth scenario"
```

I'll scaffold files based on the scenario template.

---

## Scenario Structure

Scenarios are YAML files in `.orchestrator/scenarios/`:

```yaml
name: user-authentication
description: Complete authentication system setup
version: 1.0.0
tags: [auth, security, backend]

variables:
  - name: provider
    description: Auth provider (jwt, oauth2, saml)
    default: jwt
    required: true

files:
  - path: src/auth/controller.js
    template: auth-controller.template.js
  - path: src/auth/service.js
    template: auth-service.template.js

steps:
  - Install dependencies: npm install jsonwebtoken bcrypt
  - Configure environment variables
  - Run migrations
  - Test authentication flow
```

---

## Best Practices

1. **Keep scenarios focused** - One scenario = one feature/pattern
2. **Use variables** - Make scenarios reusable across projects
3. **Include validation** - Catch errors early
4. **Document well** - Future you will thank you

---

## Resources

See `.claude/knowledge/patterns/scenario-creation.md` for detailed examples.

---

**Auto-Activation Priority:** High  
**Related Skills:** doc-generator, testing

