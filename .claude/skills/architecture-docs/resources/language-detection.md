# Language Detection for Template Selection

## Detection Priority

Check in this order (first match wins):

### 1. React/TypeScript (Frontend)
**Indicators:**
- `package.json` contains `"react"` dependency
- Files with `.tsx` or `.jsx` extensions
- `vite.config.ts`, `next.config.js`, `gatsby-config.js`

**Template:** `claude/react.md`

### 2. TypeScript (Non-React)
**Indicators:**
- `tsconfig.json` present
- Files with `.ts` extension (not `.tsx`)
- `package.json` with `"typescript"` dependency

**Template:** `claude/typescript.md`

### 3. Python
**Indicators:**
- `requirements.txt` present
- `pyproject.toml` present
- `setup.py` present
- Files with `.py` extension

**Template:** `claude/python.md`

### 4. Rust
**Indicators:**
- `Cargo.toml` present
- Files with `.rs` extension

**Template:** `claude/rust.md`

### 5. Go
**Indicators:**
- `go.mod` present
- `go.sum` present
- Files with `.go` extension

**Template:** `claude/go.md`

### 6. JavaScript (Fallback)
**Indicators:**
- `package.json` present (no TypeScript)
- Files with `.js` extension

**Template:** `claude/typescript.md` (adapt for JS)

---

## Detection Commands

```bash
# Quick detection script
detect_language() {
  if [ -f "Cargo.toml" ]; then echo "rust"
  elif [ -f "go.mod" ]; then echo "go"
  elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then echo "python"
  elif [ -f "package.json" ]; then
    if grep -q '"react"' package.json 2>/dev/null; then echo "react"
    elif [ -f "tsconfig.json" ]; then echo "typescript"
    else echo "javascript"
    fi
  else echo "unknown"
  fi
}
```

---

## Template Selection Matrix

| Project Type | Indicators | Template |
|--------------|------------|----------|
| React App | package.json + react | `react.md` |
| Next.js | next.config.* | `react.md` |
| Node.js API | package.json + express/fastify | `typescript.md` |
| CLI Tool (TS) | tsconfig.json + bin | `typescript.md` |
| Python Web | requirements.txt + flask/django/fastapi | `python.md` |
| Python CLI | pyproject.toml + click/typer | `python.md` |
| Rust Web | Cargo.toml + actix/axum | `rust.md` |
| Rust CLI | Cargo.toml + clap | `rust.md` |
| Go Web | go.mod + chi/echo/gin | `go.md` |
| Go CLI | go.mod + cobra | `go.md` |

---

## Hybrid Projects

For projects with multiple languages:

1. **Identify primary language** (most code, core logic)
2. **Create main CLAUDE.md** for primary language
3. **Add section for secondary languages** if significant

Example for Python backend + React frontend:
```markdown
# CLAUDE.md

## Backend (Python)
[Python guidelines from python.md]

## Frontend (React)
[React guidelines from react.md]
```

---

## Framework-Specific Adjustments

### React
- Add React Testing Library patterns
- Include hooks guidelines
- Add React Query patterns if detected

### Next.js
- Add App Router vs Pages Router patterns
- Include Server Components guidelines
- Add API routes patterns

### FastAPI (Python)
- Add Pydantic model patterns
- Include async patterns
- Add dependency injection patterns

### Axum (Rust)
- Add tower middleware patterns
- Include async handler patterns
- Add state extraction patterns
