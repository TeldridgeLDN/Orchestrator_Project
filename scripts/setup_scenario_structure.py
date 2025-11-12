#!/usr/bin/env python3
"""
Setup script for Partnership-Enabled Scenario System directory structure.
Creates all required directories and placeholder files for the three-layer architecture.

Usage:
    python scripts/setup_scenario_structure.py
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List


class ScenarioStructureSetup:
    """Handles creation of scenario system directory structure."""
    
    def __init__(self, base_path: Path = None):
        """Initialize with base path (defaults to ~/.claude)."""
        self.base_path = base_path or Path.home() / ".claude"
        self.created_dirs: List[Path] = []
        self.created_files: List[Path] = []
        
    def create_directory(self, path: Path, description: str = "") -> bool:
        """Create a directory if it doesn't exist."""
        try:
            if not path.exists():
                path.mkdir(parents=True, exist_ok=True)
                self.created_dirs.append(path)
                print(f"✓ Created: {path.relative_to(self.base_path.parent)} {description}")
                return True
            else:
                print(f"  Exists:  {path.relative_to(self.base_path.parent)} {description}")
                return False
        except Exception as e:
            print(f"✗ Failed to create {path}: {e}")
            return False
    
    def create_file(self, path: Path, content: str, description: str = "") -> bool:
        """Create a file with content if it doesn't exist."""
        try:
            if not path.exists():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
                self.created_files.append(path)
                print(f"✓ Created: {path.relative_to(self.base_path.parent)} {description}")
                return True
            else:
                print(f"  Exists:  {path.relative_to(self.base_path.parent)} {description}")
                return False
        except Exception as e:
            print(f"✗ Failed to create {path}: {e}")
            return False
    
    def setup_scenarios_directory(self):
        """Create Layer 1: Scenario Layer directory structure."""
        print("\n📁 Setting up Layer 1: Scenario Layer")
        print("=" * 60)
        
        scenarios_dir = self.base_path / "scenarios"
        self.create_directory(scenarios_dir, "(user-facing scenario YAMLs)")
        
        # Create subdirectories for organization
        self.create_directory(scenarios_dir / "templates", "(scenario templates)")
        self.create_directory(scenarios_dir / "deployed", "(active scenarios)")
        self.create_directory(scenarios_dir / "drafts", "(work-in-progress scenarios)")
        
        # Create README
        readme_content = """# Claude Scenarios

This directory contains scenario definitions for the Partnership-Enabled Scenario System.

## Directory Structure

- `templates/` - Reusable scenario templates
- `deployed/` - Active, deployed scenarios
- `drafts/` - Work-in-progress scenarios

## Scenario File Naming Convention

Scenarios should be named using kebab-case: `scenario-name.yaml`

Example: `client-intake-form.yaml`, `api-deployment-workflow.yaml`

## Getting Started

Create a new scenario:
```bash
claude scenario create my-workflow
```

List all scenarios:
```bash
claude scenario list
```

Deploy a scenario:
```bash
claude scenario deploy my-workflow
```

## Documentation

See the scenario_builder skill for complete documentation:
`~/.claude/skills/scenario_builder/SKILL.md`
"""
        self.create_file(scenarios_dir / "README.md", readme_content, "(documentation)")
        
        # Create example template
        example_template = """# Example Scenario Template
# This is a template showing the structure of a scenario YAML file

scenario:
  name: example_workflow
  description: "Brief description of what this scenario does"
  version: "1.0.0"
  
  # Partnership level: basic, consultative, or partner
  partnership_level: consultative
  
  # How this scenario is triggered
  trigger:
    type: manual  # manual, command, webhook, schedule
    command: "/example"  # for command triggers
  
  # Steps in the workflow
  steps:
    - id: step1
      name: "Initial Action"
      action: "skill"  # skill, command, hook, mcp, agent
      target: "example_skill"
      inputs:
        - param1
        - param2
      outputs:
        - result1
      
    - id: step2
      name: "Follow-up Action"
      action: "command"
      target: "process_results"
      depends_on:
        - step1
  
  # What this scenario produces
  outputs:
    - name: "final_result"
      type: "data"
      destination: "database"

  # Design decisions made during creation
  design_decisions:
    - decision: "Used skill instead of MCP for better integration"
      reasoning: "Skills are easier to maintain and test"
      alternatives_considered:
        - "Custom MCP"
        - "Direct API integration"
      trade_offs: "Less flexibility but more maintainable"
  
  # Potential future improvements
  potential_improvements:
    - suggestion: "Add caching layer"
      impact: "high"
      complexity: "medium"
      priority: "medium"
"""
        self.create_file(
            scenarios_dir / "templates" / "example-template.yaml",
            example_template,
            "(example template)"
        )
    
    def setup_scenario_builder_skill(self):
        """Create Layer 2: scenario_builder meta-skill structure."""
        print("\n📁 Setting up Layer 2: scenario_builder Meta-Skill")
        print("=" * 60)
        
        skill_dir = self.base_path / "skills" / "scenario_builder"
        self.create_directory(skill_dir, "(compiler & management meta-skill)")
        
        # Create subdirectories
        self.create_directory(skill_dir / "workflows", "(workflow definitions)")
        self.create_directory(skill_dir / "resources", "(supporting resources)")
        self.create_directory(skill_dir / "templates", "(code generation templates)")
        
        # Create SKILL.md
        skill_md = """# Scenario Builder Meta-Skill

**Version:** 1.0.0  
**Type:** Meta-Skill  
**Layer:** Compiler Layer (Layer 2)

## Overview

The scenario_builder meta-skill manages the lifecycle of scenarios in the Partnership-Enabled Scenario System. It acts as a consultant partner, not just an order taker, by researching alternatives, validating feasibility, and optimizing deployed workflows.

## Capabilities

- **Scenario Creation**: Interactive scenario authoring with templates
- **Scenario Analysis**: Parse and validate scenario YAMLs
- **Component Scaffolding**: Generate orchestrator primitives from scenarios
- **Alternative Exploration**: Research and compare implementation options
- **Feasibility Validation**: Check technical possibility before deployment
- **Optimization**: Continuous improvement of deployed scenarios

## Workflows

### Core Workflows
- `create_scenario` - Interactive scenario creation
- `analyze_scenario` - Parse and validate scenario YAML
- `scaffold_components` - Generate skills/commands/hooks from scenario
- `deploy_scenario` - Activate a scenario in the orchestrator

### Partnership Workflows
- `explore_alternatives` - Research implementation options
- `compare_options` - Side-by-side comparison of alternatives
- `test_feasibility` - Validate technical possibility
- `proof_of_concept` - Quick prototype for validation

### Optimization Workflows
- `optimize_scenario` - Analyze and improve deployed scenarios
- `research_best_practices` - Query latest best practices
- `suggest_improvements` - AI-driven enhancement recommendations

## Partnership Levels

The scenario_builder adapts its behavior based on partnership level:

- **basic**: Executes user instructions directly
- **consultative**: Suggests alternatives and validates feasibility
- **partner**: Proactively researches, challenges assumptions, optimizes

Set globally in `~/.claude/config.json` or per-scenario in YAML.

## Resources

- [Templates](resources/templates.md) - Scenario templates and examples
- [Best Practices](resources/best-practices.md) - Scenario design patterns
- [Troubleshooting](resources/troubleshooting.md) - Common issues

## Integration

The scenario_builder integrates with:
- **feasibility_checker** sub-agent for validation
- **Research MCP** (Perplexity) for alternatives
- **MCP Registry** for integration discovery
- **API Documentation MCP** for capability validation

## Getting Started

```bash
# Create a new scenario
claude scenario create my-workflow

# Explore alternatives
claude scenario explore my-workflow

# Deploy when ready
claude scenario deploy my-workflow
```
"""
        self.create_file(skill_dir / "SKILL.md", skill_md, "(skill documentation)")
        
        # Create metadata.json
        metadata = {
            "id": "scenario_builder",
            "name": "Scenario Builder",
            "version": "1.0.0",
            "type": "meta-skill",
            "layer": "compiler",
            "description": "Partnership-enabled scenario lifecycle management and compilation",
            "capabilities": [
                "scenario_creation",
                "scenario_analysis",
                "component_scaffolding",
                "alternative_exploration",
                "feasibility_validation",
                "scenario_optimization"
            ],
            "workflows": [
                "create_scenario",
                "analyze_scenario",
                "scaffold_components",
                "deploy_scenario",
                "explore_alternatives",
                "compare_options",
                "test_feasibility",
                "proof_of_concept",
                "optimize_scenario",
                "research_best_practices",
                "suggest_improvements"
            ],
            "partnership_levels": ["basic", "consultative", "partner"],
            "dependencies": {
                "agents": ["feasibility_checker"],
                "mcps": ["research", "mcp_registry", "api_documentation"],
                "external": ["perplexity_api"]
            },
            "created": datetime.now().isoformat(),
            "updated": datetime.now().isoformat()
        }
        self.create_file(
            skill_dir / "metadata.json",
            json.dumps(metadata, indent=2),
            "(skill metadata)"
        )
        
        # Create workflow placeholder
        workflow_placeholder = """# [Workflow Name]

**Purpose:** Brief description of what this workflow does

**Inputs:**
- Input 1
- Input 2

**Outputs:**
- Output 1
- Output 2

**Steps:**

1. Step one description
2. Step two description
3. Step three description

**Partnership Behavior:**
- **basic**: Executes steps directly
- **consultative**: Validates inputs and suggests improvements
- **partner**: Researches alternatives and optimizes approach

**Example:**

```bash
# Usage example
claude scenario <command> <args>
```
"""
        self.create_file(
            skill_dir / "workflows" / "_template.md",
            workflow_placeholder,
            "(workflow template)"
        )
        
        # Create resources placeholder
        resources_content = """# Scenario Builder Resources

## Templates

- [Example Template](../../scenarios/templates/example-template.yaml)
- Coming soon: More templates

## Best Practices

- Use descriptive scenario names
- Document design decisions
- Track alternatives considered
- Set appropriate partnership level

## Common Patterns

### Client Intake
Pattern for capturing client requirements before project kickoff.

### API Integration
Pattern for connecting to external APIs with validation.

### Automated Deployment
Pattern for CI/CD automation scenarios.
"""
        self.create_file(
            skill_dir / "resources" / "templates.md",
            resources_content,
            "(resource documentation)"
        )
    
    def setup_feasibility_checker_agent(self):
        """Create Layer 3: feasibility_checker sub-agent structure."""
        print("\n📁 Setting up Layer 3: feasibility_checker Sub-Agent")
        print("=" * 60)
        
        agent_dir = self.base_path / "agents" / "feasibility_checker"
        self.create_directory(agent_dir, "(validation sub-agent)")
        
        # Create AGENT.md
        agent_md = """# Feasibility Checker Sub-Agent

**Version:** 1.0.0  
**Type:** Sub-Agent  
**Purpose:** Validate technical feasibility of proposed integrations

## Overview

The feasibility_checker runs in parallel to validate multiple implementation alternatives. It checks MCP availability, API capabilities, authentication requirements, blockers, and estimates costs.

## Capabilities

- **MCP Validation**: Check if required MCPs are available
- **API Capability Check**: Verify API endpoints support required operations
- **Authentication Validation**: Check auth methods and requirements
- **Blocker Detection**: Identify technical impossibilities early
- **Cost Estimation**: Calculate monthly operational costs

## Output Format

```
[FEASIBILITY_SCORE: X/10]

Analysis:
- MCP Availability: ✓/✗
- API Capabilities: ✓/✗
- Authentication: ✓/✗
- Blockers: [list or "None"]
- Estimated Monthly Cost: $X

Recommendation: [deploy/needs_work/not_feasible]
Reasoning: [explanation]
```

## Integration

Called by scenario_builder workflows:
- `test_feasibility`
- `explore_alternatives`
- `compare_options`

## Parallel Execution

Multiple instances run concurrently when comparing alternatives, using asyncio for efficient validation.

## Configuration

See `config.json` for:
- API keys for validation
- Timeout settings
- Cost calculation rules
"""
        self.create_file(agent_dir / "AGENT.md", agent_md, "(agent documentation)")
        
        # Create config.json
        agent_config = {
            "agent_id": "feasibility_checker",
            "name": "Feasibility Checker",
            "version": "1.0.0",
            "type": "sub-agent",
            "capabilities": [
                "mcp_validation",
                "api_capability_check",
                "authentication_validation",
                "blocker_detection",
                "cost_estimation"
            ],
            "execution": {
                "mode": "parallel",
                "max_concurrent": 5,
                "timeout_seconds": 30
            },
            "validation_checks": [
                "mcp_registry_lookup",
                "api_endpoint_test",
                "auth_method_validation",
                "rate_limit_check",
                "cost_calculation"
            ],
            "output_format": "structured_score",
            "created": datetime.now().isoformat(),
            "updated": datetime.now().isoformat()
        }
        self.create_file(
            agent_dir / "config.json",
            json.dumps(agent_config, indent=2),
            "(agent configuration)"
        )
    
    def create_file_naming_doc(self):
        """Create file naming conventions documentation."""
        print("\n📁 Creating File Naming Conventions")
        print("=" * 60)
        
        conventions = """# File Naming Conventions

## Scenario Files

**Format:** `kebab-case.yaml`

- Use lowercase letters
- Separate words with hyphens
- Use `.yaml` extension (not `.yml`)

**Examples:**
- ✓ `client-intake-form.yaml`
- ✓ `api-deployment-workflow.yaml`
- ✓ `shopify-order-sync.yaml`
- ✗ `ClientIntake.yaml` (use kebab-case)
- ✗ `api_deployment.yaml` (use hyphens not underscores)
- ✗ `workflow.yml` (use .yaml not .yml)

## Skill Files

**Main Files:**
- `SKILL.md` - Skill documentation
- `metadata.json` - Skill manifest
- `config.json` - Configuration (optional)

**Workflow Files:** `kebab-case.md`
- `create-scenario.md`
- `test-feasibility.md`
- `explore-alternatives.md`

**Resource Files:** `kebab-case.md`
- `templates.md`
- `best-practices.md`
- `troubleshooting.md`

## Agent Files

**Main Files:**
- `AGENT.md` - Agent documentation
- `config.json` - Agent configuration
- `logic.py` - Agent implementation (Python)

## Template Files

**Format:** `kebab-case-template.yaml`

**Examples:**
- `basic-workflow-template.yaml`
- `api-integration-template.yaml`
- `client-intake-template.yaml`

## Directory Naming

**Format:** `snake_case` for code, `kebab-case` for user-facing

**Code Directories:**
- `scenario_builder/`
- `feasibility_checker/`

**User Directories:**
- `scenarios/`
- `templates/`
- `deployed/`
- `drafts/`
"""
        conventions_path = self.base_path / "docs" / "scenario-file-conventions.md"
        self.create_file(conventions_path, conventions, "(file naming guide)")
    
    def validate_structure(self) -> bool:
        """Validate that all required directories exist."""
        print("\n✓ Validating Directory Structure")
        print("=" * 60)
        
        required_paths = [
            self.base_path / "scenarios",
            self.base_path / "scenarios" / "templates",
            self.base_path / "scenarios" / "deployed",
            self.base_path / "scenarios" / "drafts",
            self.base_path / "skills" / "scenario_builder",
            self.base_path / "skills" / "scenario_builder" / "workflows",
            self.base_path / "skills" / "scenario_builder" / "resources",
            self.base_path / "skills" / "scenario_builder" / "templates",
            self.base_path / "agents" / "feasibility_checker",
        ]
        
        all_exist = True
        for path in required_paths:
            if path.exists():
                print(f"✓ {path.relative_to(self.base_path.parent)}")
            else:
                print(f"✗ {path.relative_to(self.base_path.parent)} - MISSING!")
                all_exist = False
        
        return all_exist
    
    def print_summary(self):
        """Print summary of created items."""
        print("\n" + "=" * 60)
        print("📊 Setup Summary")
        print("=" * 60)
        print(f"Directories created: {len(self.created_dirs)}")
        print(f"Files created: {len(self.created_files)}")
        print(f"\nBase path: {self.base_path}")
        print("\n✅ Scenario system directory structure is ready!")
        print("\nNext steps:")
        print("  1. Review the example template in scenarios/templates/")
        print("  2. Read the scenario_builder SKILL.md")
        print("  3. Start Task 67: Implement YAML Schema Validation")


def main():
    """Main setup function."""
    print("\n" + "=" * 60)
    print("🚀 Partnership-Enabled Scenario System Setup")
    print("=" * 60)
    print("\nThis script will create the directory structure for:")
    print("  - Layer 1: Scenario Layer (user-facing YAMLs)")
    print("  - Layer 2: scenario_builder Meta-Skill (compiler)")
    print("  - Layer 3: feasibility_checker Sub-Agent (validation)")
    
    setup = ScenarioStructureSetup()
    
    # Create all directories and files
    setup.setup_scenarios_directory()
    setup.setup_scenario_builder_skill()
    setup.setup_feasibility_checker_agent()
    setup.create_file_naming_doc()
    
    # Validate structure
    if setup.validate_structure():
        setup.print_summary()
        return 0
    else:
        print("\n✗ Setup validation failed!")
        return 1


if __name__ == "__main__":
    exit(main())

