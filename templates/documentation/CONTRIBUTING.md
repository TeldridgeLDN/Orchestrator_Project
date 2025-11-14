# Contributing to [Project Name]

Thank you for considering contributing to [Project Name]! This document provides guidelines for contributing to this project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

**Key Principles**:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project and community
- Show empathy towards other contributors

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork:
git clone https://github.com/YOUR-USERNAME/[project-name].git
cd [project-name]

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/[project-name].git
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your development configuration
# (Use test/dummy API keys, never production keys)
```

### Verify Setup

```bash
# Run tests to verify everything works
npm test

# Start development server
npm run dev
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming Convention**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### 2. Make Changes

- Write clean, readable code
- Follow the [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.js

# Run linter
npm run lint

# Check test coverage
npm run coverage
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 5. Push & Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### JavaScript/Node.js Style

- **ES Modules**: Use `import`/`export` syntax (not `require`)
- **Async/Await**: Prefer async/await over callbacks or raw promises
- **Arrow Functions**: Use arrow functions for callbacks
- **Destructuring**: Use object/array destructuring where appropriate
- **Const/Let**: Use `const` by default, `let` only when reassignment needed

### Code Formatting

```bash
# Format code (runs automatically on commit)
npm run format
```

**Standards**:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.js`

### Documentation

- Add JSDoc comments for all public functions
- Include parameter types and return types
- Provide usage examples for complex functions

```javascript
/**
 * Calculate the total price with tax
 * @param {number} price - Base price before tax
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns {number} Total price including tax
 * @example
 * calculateTotal(100, 0.08) // Returns 108
 */
function calculateTotal(price, taxRate) {
  return price * (1 + taxRate);
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no feature change or bug fix)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

```bash
# Simple feature
git commit -m "feat: add user authentication"

# Bug fix with scope
git commit -m "fix(api): resolve null pointer in user endpoint"

# With body
git commit -m "feat(auth): implement JWT token refresh

- Add refresh token endpoint
- Update token expiration to 1 hour
- Add tests for refresh flow"

# Breaking change
git commit -m "feat(api): change response format

BREAKING CHANGE: API responses now wrapped in { data, meta } object"
```

---

## Pull Request Process

### Before Submitting

✅ **Checklist**:
- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with `main`

### PR Title Format

Follow same format as commit messages:
```
feat(auth): add two-factor authentication
```

### PR Description Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[Describe testing done]

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Follows style guidelines
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linters
2. **Code Review**: At least one maintainer reviews
3. **Changes Requested**: Address feedback, push updates
4. **Approval**: Maintainer approves PR
5. **Merge**: Maintainer merges to main

---

## Testing Requirements

### Test Coverage

- **Minimum Coverage**: 80% for new code
- **Required Tests**:
  - Unit tests for all new functions
  - Integration tests for API endpoints
  - E2E tests for critical user flows

### Writing Tests

```javascript
// tests/example.test.js
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../lib/utils.js';

describe('calculateTotal', () => {
  it('should calculate total with tax', () => {
    expect(calculateTotal(100, 0.08)).toBe(108);
  });

  it('should handle zero tax rate', () => {
    expect(calculateTotal(100, 0)).toBe(100);
  });

  it('should throw for negative price', () => {
    expect(() => calculateTotal(-10, 0.08)).toThrow();
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode (during development)
npm test -- --watch

# Coverage report
npm run coverage

# Specific test file
npm test tests/auth.test.js
```

---

## Documentation

### When to Update Docs

- New features require documentation
- Bug fixes may need clarification
- API changes always need documentation updates
- Configuration changes need `.env.example` updates

### Documentation Locations

- **README.md**: Quick start and overview
- **Docs/API.md**: Complete API reference
- **Docs/ARCHITECTURE.md**: System design
- **Docs/ADR/**: Architectural decisions
- **Code Comments**: Complex logic explanation

---

## Getting Help

### Communication Channels

- **Issues**: [GitHub Issues](https://github.com/org/repo/issues) - Bug reports, feature requests
- **Discussions**: [GitHub Discussions](https://github.com/org/repo/discussions) - Questions, ideas
- **Chat**: [Discord/Slack link] - Real-time chat

### Asking Questions

When asking for help:
1. **Search first**: Check existing issues/discussions
2. **Be specific**: Include error messages, steps to reproduce
3. **Provide context**: OS, Node version, relevant config
4. **Code samples**: Use code blocks for readability

---

## Recognition

Contributors who make significant contributions will be:
- Added to `CONTRIBUTORS.md`
- Mentioned in release notes
- Credited in the project README

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](./LICENSE)).

---

**Thank you for contributing to [Project Name]!** 🎉

Your contributions help make this project better for everyone.

