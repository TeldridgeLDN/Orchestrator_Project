You will be reviewing and revising a Product Requirements Document (PRD) to make it more understandable and workable for Claude Code implementation. The goal is to transform the provided PRD into a detailed, well-structured document that Claude Code can effectively work with to implement a hybrid orchestration system.

Here is the PRD text you need to review and revise:

<prd_text>
{{Perfect — that’s the right time to formalize this idea into a **PRD (Product Requirements Document)** so Claude Code (or another LLM developer environment) can use it as a structured spec to start building.

Below is a **comprehensive, implementation-grade PRD** that reflects your intent:

* Diet103 is already running locally (repo-level).
* You want orchestration between projects.
* Efficiency and token optimization are critical.
* The hybrid pattern (PAI for global infra + diet103 for activation hooks) should be the backbone.

---

# 🧭 **PRD: Multi-Project AI Orchestration Layer (Hybrid Claude Infrastructure System)**

## 1. **Project Summary**

### Goal

Create a **meta-orchestration system** that manages, switches between, and provisions multiple Claude projects or repos — each with its own `.claude/` setup — while maintaining the **existing diet103 runtime** inside each repo.

The system should:

* Allow the user to create, register, switch between, and remove AI-enabled projects.
* Ensure that **only one project’s Claude context** (skills, hooks, metadata) is active at a time.
* Prevent unnecessary token consumption by **lazy-loading** skills and context only when a project is active.

---

## 2. **Background**

### Current State

* **diet103** is installed locally and functions perfectly inside a single repository.
* It provides in-repo **skill auto-activation** via `skill-rules.json` and event hooks (`UserPromptSubmit`, etc.).
* Each repo is self-contained — there is **no global layer** for orchestrating between multiple repos.

### Problem

* The user must manually switch repos to work with different projects.
* There’s no unified way to create new Claude-enabled projects or move context between them.
* Loading multiple `.claude/` contexts simultaneously could cause high token consumption and redundant skill activation.

---

## 3. **Objectives**

| Objective                              | Description                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **1. Global Orchestration Layer**      | A system-wide operator that tracks and manages multiple Claude projects.                                |
| **2. Project Switching**               | Users can switch context (`switch project <name>`) without reinitializing Claude manually.              |
| **3. Project Creation & Registration** | Users can scaffold a new Claude project (empty or from a template).                                     |
| **4. Efficient Context Loading**       | Only one project’s context is hydrated at a time — skills and hooks from inactive projects are dormant. |
| **5. Compatibility**                   | Must work with the existing `diet103` structure and hook system, without altering project internals.    |
| **6. Extensible Metadata**             | Use PAI-style manifesting (e.g. `metadata.json`) to allow richer orchestration metadata in the future.  |

---

## 4. **Core Concepts**

### 4.1 Project Directory Structure

Each Claude project remains self-contained:

```
<project_root>/
  .claude/
    skill-rules.json
    skills/
    resources/
```

The orchestrator manages these from a **global root**:

```
~/.claude/projects/
  ├── infra-docs/
  ├── ai-prototype/
  └── new-app/
~/.claude/config.json
```

### 4.2 Global Configuration

Global configuration file (`~/.claude/config.json`):

```json
{
  "active_project": "ai-prototype",
  "projects": {
    "infra-docs": "/Users/user/Projects/infra-docs",
    "ai-prototype": "/Users/user/Projects/ai-prototype"
  }
}
```

### 4.3 Orchestrator Meta-Skill

A **“Project Orchestrator” meta-skill** lives at the global level (`~/.claude/skills/project_orchestrator/`).

It supports:

* `create project <name>` → scaffolds new repo with minimal `.claude/` from template
* `switch project <name>` → updates `active_project` in config, unmounts old skill set, mounts new
* `list projects` → enumerates available Claude projects
* `remove project <name>` → deregisters project safely

Example trigger (used by the hook system):

```yaml
hooks:
  - event: UserPromptSubmit
    when: prompt includes ["switch project", "create project"]
    action: invoke project_orchestrator
```

---

## 5. **System Architecture**

### 5.1 Components

| Component                             | Description                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Global Manager (PAI-derived)**      | CLI + runtime manager that maintains the project registry, templates, and active context.                    |
| **Per-Project Runtimes (diet103)**    | Local `.claude/` systems that handle auto-activation and skill execution.                                    |
| **Bridge Layer (Hybrid Integration)** | A lightweight adapter that connects global manager → project runtime (activates/deactivates skill contexts). |

### 5.2 Process Flow

#### a. Project Creation

1. User runs `claude project create my-new-app`
2. CLI copies `.claude-template/` to new folder.
3. Registers it in global config (`~/.claude/config.json`).
4. Sets it as `active_project`.

#### b. Project Switching

1. User runs `claude project switch my-other-app`.
2. Global manager updates `active_project`.
3. Unmount current `.claude/` hooks (stop listening).
4. Load new project’s `skill-rules.json`.
5. Resume auto-activation only for new project.

#### c. Context Handling (Token Control)

* Only the **active project’s** hooks and rules are loaded into Claude’s memory.
* Other projects remain *cold* (file-based only).
* When switching, flush in-memory skill data before rehydration.
* Heavy resources are **lazy-loaded** only when their hooks trigger (`progressive disclosure` rule from diet103).

---

## 6. **Efficiency & Token Optimization**

| Strategy                                       | Description                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Single Active Context**                      | Only one `.claude/` directory is active at runtime.                                        |
| **Progressive Disclosure (diet103 principle)** | Skills load minimal context first; large workflows only when needed.                       |
| **Deferred Resource Loading**                  | On project switch, load only `metadata.json` and top-level rules, not all skills.          |
| **Manifest-based Diffing**                     | Before loading, compare old/new skill manifests; only load changed modules.                |
| **Optional Cache**                             | Keep last active project’s light metadata in memory to resume quickly without full reload. |

---

## 7. **Interfaces**

### 7.1 CLI Commands

| Command                        | Action                    |
| ------------------------------ | ------------------------- |
| `claude project list`          | Show registered projects  |
| `claude project create <name>` | Create new Claude project |
| `claude project switch <name>` | Switch active project     |
| `claude project remove <name>` | Deregister project        |
| `claude project info`          | Show active project info  |

### 7.2 API Endpoints (for hook use)

```
/api/project/active → returns current project name
/api/project/switch → accepts { name: <project> }
```

### 7.3 Skill Manifest Format (for cross-compatibility)

Each project’s `.claude/metadata.json`:

```json
{
  "project_id": "ai-prototype",
  "description": "Experimental Claude + local agents",
  "skills": ["refactor_assistant", "doc_generator"],
  "version": "0.1.0"
}
```

---

## 8. **Integration Plan**

| Step                                        | Action                                        | Owner       |
| ------------------------------------------- | --------------------------------------------- | ----------- |
| **1. Extract existing diet103 hook system** | Keep per-repo `hooks/` intact                 | Local       |
| **2. Create global orchestrator skeleton**  | Build CLI + config manager under `~/.claude/` | Claude Code |
| **3. Implement adapter layer**              | Adapter toggles active `.claude/` context     | Claude Code |
| **4. Add orchestration hooks**              | `project_orchestrator` skill listens globally | Claude Code |
| **5. Test token-safe switching**            | Verify no double-load or lingering skills     | You / Local |
| **6. Extend to templates**                  | Add `claude project create` from boilerplate  | Claude Code |

---

## 9. **Success Metrics**

| Metric                       | Target                                    |
| ---------------------------- | ----------------------------------------- |
| Project switch time          | < 1s (metadata only)                      |
| Context token footprint      | ≤ single project’s `.claude/` context     |
| Skill activation correctness | ≥ 95% success per switch                  |
| Resource reloading           | Only when project changes or rule updated |
| Backward compatibility       | diet103 projects run unchanged            |

---

## 10. **Future Extensions**

* **Cross-project dependency linking** (e.g., “use infra-docs skills inside ai-prototype”).
* **Shared skill library** for common tools (reduces duplication).
* **Remote project registry** synced via Git or cloud.
* **Voice or Alfred integration** for “Switch to project X” commands.

---

## 11. **Risks & Mitigations**

| Risk                                | Mitigation                               |
| ----------------------------------- | ---------------------------------------- |
| Double-loading project hooks        | Centralize activation in adapter layer   |
| Drift between projects and registry | Implement `claude project sync` command  |
| Token overuse from stale contexts   | Always unload inactive `.claude/`        |
| Corrupted global config             | Validate before switch; keep backup file |
| OS path conflicts                   | Normalize and canonicalize project paths |

---

## 12. **Deliverables**

1. `project_orchestrator` meta-skill (YAML + JS action).
2. `claude` CLI tool (`create`, `switch`, `list`, `remove`).
3. `~/.claude/config.json` global registry.
4. Adapter script that mounts/unmounts `.claude/` contexts.
5. Updated documentation (`README_GLOBAL.md`).

---

## 13. **Definition of Done**

✅ User can:

* Run `claude project create my-new-app` → scaffolds a working `.claude/` folder.
* Run `claude project switch ai-prototype` → context changes cleanly.
* Only active project’s skills load.
* Token usage remains roughly equal to single-project operation.
* Existing diet103 repos continue to function unchanged.

---

Would you like me to produce the **first-draft scaffolding** (folder + YAML + CLI command skeleton) for Claude Code to begin implementing this PRD — i.e. what you’d drop into your `~/.claude/` to kickstart development?
Perfect — that’s exactly the next right step:
we’ll **bootstrap the hybrid orchestration system** so Claude Code (or your LLM dev environment) can start implementing it, *while also defining a clean separation between global and local Claude.md files*.

Below I’ll give you:

1. ✅ A **starter folder + file scaffolding** for the hybrid system.
2. ✅ A **naming and placement convention** for `Claude.md` files (global vs local).
3. ✅ A **CLI + YAML scaffold** Claude Code can start building immediately.

---

# 🧱 1. Folder + File Scaffolding (for `~/.claude/`)

Here’s the top-level structure of your new **multi-project hybrid system**:

```
~/.claude/
│
├── config.json                     # global config: tracks active project, registry
├── Claude.md                       # GLOBAL Claude.md (meta-orchestrator level)
│
├── skills/
│   └── project_orchestrator/
│       ├── SKILL.md                # documentation for orchestrator skill
│       ├── metadata.json           # skill manifest (type: "meta")
│       ├── hooks.yaml              # defines orchestration events
│       └── actions/
│           ├── create_project.js
│           ├── switch_project.js
│           ├── list_projects.js
│           └── remove_project.js
│
├── templates/
│   └── base-project-template/
│       ├── .claude/
│       │   ├── Claude.md           # LOCAL template Claude.md (for new repos)
│       │   ├── skill-rules.json
│       │   ├── skills/
│       │   │   └── example_skill/
│       │   │       └── SKILL.md
│       │   └── resources/
│       └── README.md
│
└── projects/
    ├── ai-prototype/
    │   └── link → /Users/you/Projects/ai-prototype/.claude/
    └── infra-docs/
        └── link → /Users/you/Projects/infra-docs/.claude/
```

### 🗂️ Purpose

* `~/.claude/config.json` is your **global brain** (registry of projects + active one).
* The **global Claude.md** describes orchestration rules and meta-skills.
* Each project continues to have its own `.claude/Claude.md`, untouched by this system.
* The orchestrator skill manages context switching (mount/unmount `.claude/`).

---

# 🧩 2. Global vs Local `Claude.md` Distinction

| Scope                   | File                          | Purpose                                                                  | Example Contents                                                                                                                         |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Global**              | `~/.claude/Claude.md`         | Describes orchestrator behavior, global skills, and cross-project rules. | “This system manages multiple Claude projects. Only one `.claude/` is active at a time. The active project is defined in `config.json`.” |
| **Local (per-project)** | `<project>/.claude/Claude.md` | Describes the project context, team setup, tone, and local hooks.        | “This project is a Next.js app. Use the ‘refactor_assistant’ skill for code edits.”                                                      |

### ✅ Rule of Thumb

* **Global Claude.md** = meta layer (how to *switch* and *manage* projects).
* **Local Claude.md** = domain layer (how to *work within* a project).
* On switch, the orchestrator loads only one local Claude.md into memory to prevent context bloat.

---

# ⚙️ 3. CLI & Adapter Skeleton

### `bin/claude` (CLI entrypoint)

```bash
#!/usr/bin/env bash
# Basic hybrid orchestrator CLI

CLAUDE_HOME="$HOME/.claude"
CONFIG="$CLAUDE_HOME/config.json"

case "$1" in
  "project")
    case "$2" in
      "list")
        node "$CLAUDE_HOME/skills/project_orchestrator/actions/list_projects.js"
        ;;
      "create")
        node "$CLAUDE_HOME/skills/project_orchestrator/actions/create_project.js" "$3"
        ;;
      "switch")
        node "$CLAUDE_HOME/skills/project_orchestrator/actions/switch_project.js" "$3"
        ;;
      "remove")
        node "$CLAUDE_HOME/skills/project_orchestrator/actions/remove_project.js" "$3"
        ;;
      *)
        echo "Usage: claude project [list|create|switch|remove] [name]"
        ;;
    esac
    ;;
  *)
    echo "Unknown command"
    ;;
esac
```

Make this executable:

```bash
chmod +x ~/.claude/bin/claude
```

---

### `skills/project_orchestrator/hooks.yaml`

```yaml
hooks:
  - event: UserPromptSubmit
    when: prompt includes ["switch project", "create project", "list projects", "remove project"]
    action: call_project_orchestrator
```

---

### `skills/project_orchestrator/actions/switch_project.js`

```js
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const home = process.env.HOME;
const configPath = path.join(home, '.claude/config.json');
const newProject = process.argv[2];

if (!newProject) {
  console.error('Please specify a project name.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
if (!config.projects[newProject]) {
  console.error(`Project '${newProject}' not found in registry.`);
  process.exit(1);
}

config.active_project = newProject;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`✅ Switched active project to: ${newProject}`);

// Optional: unload old .claude and mount new one
// (Claude Code to implement adapter logic)
```

---

### `skills/project_orchestrator/metadata.json`

```json
{
  "id": "project_orchestrator",
  "type": "meta-skill",
  "description": "Manages multiple Claude projects, allowing creation, listing, switching, and removal.",
  "version": "0.1.0",
  "entry_points": {
    "cli": "bin/claude",
    "hooks": "skills/project_orchestrator/hooks.yaml"
  }
}
```

---

# 🧠 4. Token Efficiency Design

To integrate without burning tokens unnecessarily:

1. **Only the active project’s `Claude.md` + `skill-rules.json`** are loaded.
   → The orchestrator simply updates which folder is “mounted”.

2. **Global context** (the orchestrator skill and config) stays *tiny*.
   → It never loads local project code unless explicitly switched.

3. **Switch event flushes context**.

   * When a project is switched, the orchestrator skill triggers a `flush` event to drop cached skill embeddings.

4. **Lazy-load heavy resources.**

   * Diet103’s existing “progressive disclosure” principle continues to apply per project.
   * The orchestrator only keeps metadata (`metadata.json`) in memory between projects.

5. **Optional optimization:**

   * Cache last active project’s metadata for instant rehydration.
   * Don’t reload skill resources unless file timestamps have changed.

---

# 🧩 5. Validation Checks (Claude Code should implement)

Claude Code can automatically verify:

| Check                    | Description                                  | Location                                 |
| ------------------------ | -------------------------------------------- | ---------------------------------------- |
| `config.json` integrity  | Ensure valid JSON and paths exist            | `~/.claude/config.json`                  |
| Global Claude.md present | Must exist for orchestrator to run           | `~/.claude/Claude.md`                    |
| Local Claude.md present  | Each registered project must have one        | `<project>/.claude/Claude.md`            |
| Hook sync                | Hooks registered correctly                   | `skills/project_orchestrator/hooks.yaml` |
| Token footprint          | Ensure only one `.claude/` loaded at runtime | adapter runtime logs                     |

---

# 🧩 6. Next Steps (for Claude Code to build)

1. ✅ Initialize `~/.claude/` structure with scaffolding above.
2. ✅ Implement `claude project [list|create|switch|remove]` CLI commands.
3. ✅ Build adapter for mounting/unmounting `.claude/` directories dynamically.
4. ✅ Add token-safe context management (only active project loaded).
5. ✅ Verify correct separation of global vs local Claude.md files.

---

Would you like me to include **a small test project** (`demo-app/.claude/`) and the expected output when you run `claude project switch demo-app` — so Claude Code can validate its integration against a known working example?
Excellent scenario — this is exactly the kind of *“new, multi-scope project”* that the hybrid system was designed to handle. Let’s walk through this carefully and concretely — step by step — to show:

1. **How the hybrid system behaves** (from creation → orchestration → runtime).
2. **Where your Shopify-specific skill fits**.
3. **How the token and context model performs** for such a complex project.
4. **What you’d gain vs. doing it manually in a single-repo setup.**

---

## 🧭 Scenario Overview: “Shopify Store Project”

**Goal:**
Create a new Claude-assisted project that builds an entire Shopify store, including:

* Front-end design
* Product inventory organization
* SEO setup (Google AdWords + analytics)
* Payment gateway configuration

**Assumptions:**

* You have an existing global hybrid system installed (`~/.claude/`).
* You already have a `shopify_skill` available in your skill library (either local or shared).
* diet103 is running correctly inside repos.
* Claude Code and the Orchestrator meta-skill are active.

---

## 🏗️ Step 1 — Creating the Project

You’d run:

```bash
claude project create shopify-store
```

**What happens under the hood:**

1. The **project_orchestrator** meta-skill copies the `base-project-template/` into a new folder:

   ```
   ~/Projects/shopify-store/.claude/
   ```

2. It registers it in global config:

   ```json
   {
     "active_project": "shopify-store",
     "projects": {
       "shopify-store": "/Users/you/Projects/shopify-store",
       ...
     }
   }
   ```

3. It sets the new project as **active** — so only that `.claude/` folder is now mounted.

4. Inside the new `.claude/`, the orchestrator scaffolds:

   ```
   .claude/
     Claude.md               # project-level context
     skill-rules.json        # includes Shopify skill rule
     skills/
       shopify_skill/        # copied or symlinked from shared library
         SKILL.md
         actions/
     resources/
   ```

🧩 *Key advantage:* This project instantly gets a Claude runtime that’s aware of its own context (e.g., “building a Shopify store”) without touching or loading any other repos.

---

## 🧠 Step 2 — Context and Token Efficiency

At this point, only **two contexts** are active in Claude’s memory:

1. **Global (tiny)** — orchestrator metadata + global Claude.md (~a few hundred tokens).
2. **Local (current project)** — shopify-store’s `.claude/Claude.md`, skill rules, and `shopify_skill/SKILL.md`.

Everything else (like your other projects: `infra-docs`, `ai-prototype`) is cold-stored on disk.

💡 **Token footprint**: ~1.5× a normal single project, not additive.
This is because only the *active* `.claude/` gets loaded into context; other projects remain dormant.

---

## 🔧 Step 3 — Working Session Behavior

When you start describing your goals to Claude:

> “I want to design a new Shopify store for eco-friendly skincare products.”

The following sequence happens:

1. The orchestrator confirms that `shopify-store` is the **active project** (from `config.json`).

2. The local `shopify_skill` auto-activates via diet103’s `skill-rules.json`, e.g.:

   ```json
   {
     "trigger_phrases": ["Shopify", "online store", "inventory", "AdWords"],
     "skill": "shopify_skill"
   }
   ```

3. The skill itself handles:

   * **Front-end workflow** → triggers `frontend_designer_agent`.
   * **Product inventory setup** → calls Shopify API helper.
   * **SEO configuration** → uses AdWords/Analytics setup action.
   * **Payment integration** → triggers payment setup agent.

4. All this happens *within the same project context*, so Claude doesn’t have to juggle data from other repos.

---

## ⚙️ Step 4 — Adding New Capabilities Mid-Project

Say you later want to handle blog content or influencer integration.

You can do this in two ways:

1. Add new skills *within the project*:

   ```bash
   claude skill add blog_content_skill --to shopify-store
   ```

   → Adds to `.claude/skills/` for this project.

2. Or register a shared skill globally:

   ```bash
   claude skill link blog_content_skill --global
   ```

   → Links the skill in `~/.claude/shared-skills/` but loads it only when activated by rules.

🧩 The orchestrator will see this addition and update its manifests, but **not reload** unrelated projects — again keeping tokens lean.

---

## 🔄 Step 5 — Switching to Another Project

When you’re done for the day and say:

```bash
claude project switch ai-prototype
```

…the system:

1. Unloads `.claude/Claude.md` and hooks for `shopify-store`.
2. Writes a small cache file for fast resume (`~/.claude/cache/shopify-store.json`).
3. Loads the `.claude/` context for `ai-prototype`.
4. Updates the global config’s `active_project`.

Total overhead: ~0.5–1s
No tokens wasted on irrelevant projects.

---

## 📊 System Performance Summary (for Shopify scenario)

| Function              | Result                                                             |
| --------------------- | ------------------------------------------------------------------ |
| **Project creation**  | Instant (copied from template)                                     |
| **Context size**      | ~1 local + small global (≈ 20–30% more tokens than single project) |
| **Activation speed**  | Shopify skill auto-activated via rule                              |
| **Switching speed**   | ~1s (unload/load cycle)                                            |
| **Memory efficiency** | Only one `.claude/` in memory                                      |
| **Parallel safety**   | Global manager ensures single active project                       |
| **Scalability**       | Unlimited projects (each isolated under `~/.claude/projects/`)     |

---

## 🧩 6. What Makes This Work Well for You

1. **Each project becomes its own workspace**, isolated by domain — so Claude doesn’t confuse contexts between your Shopify site and, say, your OmniFocus extension project.

2. **Shopify-specific skills** stay modular and can be reused later (copy or symlink them).

3. **SEO / AdWords tokens** are only loaded when those sub-skills activate — diet103’s progressive disclosure ensures you’re not spending tokens on the whole skill suite at once.

4. **If the project grows** (say you later want to add a fulfillment backend), you can extend it without touching global state — just new local skills.

5. **The orchestrator’s global Claude.md** remains tiny and purely procedural (just rules for managing projects), while each project’s Claude.md keeps its unique “personality” and working memory.

---

## 🚀 In Short

| Feature                    | Hybrid System Behavior                                |
| -------------------------- | ----------------------------------------------------- |
| Create new Shopify project | ✅ `claude project create shopify-store`               |
| Load context efficiently   | ✅ Only active project’s Claude.md loaded              |
| Token control              | ✅ Progressive disclosure + lazy skill load            |
| Shopify skill handling     | ✅ Local `.claude/skills/shopify_skill` auto-activated |
| Context switching          | ✅ Seamless via orchestrator CLI or hook               |
| Isolation                  | ✅ Full — no bleed from other repos                    |
| Extension                  | ✅ Add or link new skills anytime                      |

---

## 🧠 Bonus: Claude.md Distinction in Practice

| File                                                     | Role               | Example Line                                                                                                   |
| -------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **`~/.claude/Claude.md` (global)**                       | Orchestrator brain | “When the user says ‘create new project’, call the project_orchestrator skill.”                                |
| **`~/Projects/shopify-store/.claude/Claude.md` (local)** | Project brain      | “This project is focused on building a Shopify store. Use `shopify_skill` for store setup and SEO management.” |

💡 You can think of this as:

> Global Claude.md = “Meta-operator”
> Local Claude.md = “Specialist agent environment”

---

Would you like me to draft the **`Claude.md` contents** for both levels — the **global one** (orchestrator layer) and the **local one** (Shopify project) — so you can see how they differ and work together cleanly?
}}
</prd_text>

Your task is to analyze this PRD and make necessary changes to improve its clarity, structure, and implementability. Focus on creating a document that clearly separates concerns between global and local Claude.md files and provides concrete implementation guidance.

Before providing your revised PRD, use the scratchpad below to analyze the current document and plan your improvements:

<scratchpad>
Analyze the current PRD structure, identify areas that need clarification, note any missing implementation details, and plan how to reorganize the content for better understanding.
</scratchpad>

When revising the PRD, focus on these key improvements:

1. **Structure and Organization**: Reorganize content with clear headings, logical flow, and proper hierarchy
2. **Clarity and Precision**: Remove ambiguous language, define technical terms, and provide specific examples
3. **Implementation Details**: Add concrete steps, file structures, and code examples where needed
4. **Separation of Concerns**: Clearly distinguish between global orchestration and local project management
5. **Actionable Instructions**: Transform abstract concepts into specific, actionable requirements
6. **Technical Specifications**: Include detailed technical requirements, file formats, and system behaviors
7. **Use Cases and Examples**: Add practical examples and scenarios to illustrate concepts
8. **Dependencies and Prerequisites**: Clearly state what needs to be in place before implementation

The revised PRD should be comprehensive enough that a developer using Claude Code can:
- Understand the system architecture
- Implement the hybrid orchestration system
- Create the necessary file structures and configurations
- Understand the distinction between global and local Claude.md files
- Follow the implementation steps in the correct order

Provide your revised PRD inside <revised_prd> tags. The revised document should maintain all the essential technical content while significantly improving readability, structure, and implementability.