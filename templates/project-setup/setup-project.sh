#!/bin/bash
# Orchestrator Project Setup Script
# Based on diet103 & Miessler infrastructure patterns
# Version: 1.0.0

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/template"

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

show_usage() {
    cat << EOF
Usage: setup-project.sh [OPTIONS] PROJECT_PATH

Setup Orchestrator infrastructure for a new or existing project.

ARGUMENTS:
  PROJECT_PATH          Path to the project directory (will be created if doesn't exist)

OPTIONS:
  -n, --name NAME       Project name (defaults to directory basename)
  -t, --type TYPE       Project type: backend, frontend, fullstack, library (default: fullstack)
  -s, --skills LIST     Comma-separated list of skills to include
                        Available: scenario-manager, backend-dev, frontend-dev, testing, doc-generator
                        Default: scenario-manager
  --no-taskmaster       Skip Taskmaster initialization
  --no-register         Skip Orchestrator registration
  -y, --yes             Skip all prompts, use defaults
  -h, --help            Show this help message

EXAMPLES:
  # Basic setup
  setup-project.sh ~/projects/my-api

  # Backend project with specific skills
  setup-project.sh -t backend -s "backend-dev,testing" ~/projects/acme-api

  # Frontend project, no prompts
  setup-project.sh -y -t frontend -s "frontend-dev" ~/projects/my-blog

  # Full setup with custom name
  setup-project.sh -n "ACME Corp API" -t backend ~/projects/acme

AFTER SETUP:
  cd PROJECT_PATH
  cat DAILY_WORKFLOW.md     # Read workflow guide
  orch where                # Verify setup
  orch next                 # Start working

EOF
}

# Parse arguments
PROJECT_PATH=""
PROJECT_NAME=""
PROJECT_TYPE="fullstack"
SKILLS="scenario-manager"
SKIP_TASKMASTER=false
SKIP_REGISTER=false
AUTO_YES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -t|--type)
            PROJECT_TYPE="$2"
            shift 2
            ;;
        -s|--skills)
            SKILLS="$2"
            shift 2
            ;;
        --no-taskmaster)
            SKIP_TASKMASTER=true
            shift
            ;;
        --no-register)
            SKIP_REGISTER=true
            shift
            ;;
        -y|--yes)
            AUTO_YES=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            if [[ -z "$PROJECT_PATH" ]]; then
                PROJECT_PATH="$1"
            else
                print_error "Unknown option: $1"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$PROJECT_PATH" ]]; then
    print_error "PROJECT_PATH is required"
    show_usage
    exit 1
fi

# Validate project type
if [[ ! "$PROJECT_TYPE" =~ ^(backend|frontend|fullstack|library)$ ]]; then
    print_error "Invalid project type: $PROJECT_TYPE"
    print_info "Valid types: backend, frontend, fullstack, library"
    exit 1
fi

# Resolve absolute path
PROJECT_PATH="$(cd "$(dirname "$PROJECT_PATH")" 2>/dev/null && pwd)/$(basename "$PROJECT_PATH")" || PROJECT_PATH="$(pwd)/$PROJECT_PATH"

# Set project name if not provided
if [[ -z "$PROJECT_NAME" ]]; then
    PROJECT_NAME="$(basename "$PROJECT_PATH")"
fi

# Check if template exists
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    print_error "Template directory not found: $TEMPLATE_DIR"
    exit 1
fi

# Main execution
print_header "Orchestrator Project Setup"
echo "Project Path: $PROJECT_PATH"
echo "Project Name: $PROJECT_NAME"
echo "Project Type: $PROJECT_TYPE"
echo "Skills: $SKILLS"
echo ""

# Confirm unless --yes flag
if [[ "$AUTO_YES" != true ]]; then
    read -p "Proceed with setup? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
        print_warning "Setup cancelled"
        exit 0
    fi
fi

# Create project directory
print_header "Step 1: Creating Project Directory"
if [[ ! -d "$PROJECT_PATH" ]]; then
    mkdir -p "$PROJECT_PATH"
    print_success "Created directory: $PROJECT_PATH"
else
    print_info "Directory already exists: $PROJECT_PATH"
fi

cd "$PROJECT_PATH"

# Copy infrastructure
print_header "Step 2: Installing Infrastructure"

# Create directory structure
mkdir -p .claude/{hooks,skills,agents,knowledge/{patterns,decisions,prompts}}
mkdir -p .cursor/rules
print_success "Created directory structure"

# Copy core files
cp "$TEMPLATE_DIR/.claude/settings.json" .claude/
print_success "Copied .claude/settings.json"

cp "$TEMPLATE_DIR/.claude/skill-rules.json" .claude/
print_success "Copied .claude/skill-rules.json"

cp "$TEMPLATE_DIR/.claude/hooks/skill-activation.js" .claude/hooks/
chmod +x .claude/hooks/skill-activation.js
print_success "Copied skill-activation.js hook"

# Copy workflow guide
cp "$TEMPLATE_DIR/DAILY_WORKFLOW.md" .
print_success "Copied DAILY_WORKFLOW.md"

# Copy README template
cp "$TEMPLATE_DIR/README_TEMPLATE.md" README.md
sed -i.bak "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" README.md
sed -i.bak "s/{{PROJECT_TYPE}}/$PROJECT_TYPE/g" README.md
rm README.md.bak 2>/dev/null || true
print_success "Created README.md"

# Copy skills based on selection
print_header "Step 3: Installing Skills"
IFS=',' read -ra SKILL_ARRAY <<< "$SKILLS"
for skill in "${SKILL_ARRAY[@]}"; do
    skill=$(echo "$skill" | xargs)  # Trim whitespace
    
    if [[ -d "$TEMPLATE_DIR/.claude/skills/$skill" ]]; then
        cp -r "$TEMPLATE_DIR/.claude/skills/$skill" .claude/skills/
        print_success "Installed skill: $skill"
    else
        print_warning "Skill not found: $skill (skipping)"
    fi
done

# Copy project-type specific agents
print_header "Step 4: Installing Agents"
case $PROJECT_TYPE in
    backend)
        cp "$TEMPLATE_DIR/.claude/agents/backend-"*.md .claude/agents/ 2>/dev/null || true
        print_success "Installed backend agents"
        ;;
    frontend)
        cp "$TEMPLATE_DIR/.claude/agents/frontend-"*.md .claude/agents/ 2>/dev/null || true
        print_success "Installed frontend agents"
        ;;
    fullstack)
        cp "$TEMPLATE_DIR/.claude/agents/backend-"*.md .claude/agents/ 2>/dev/null || true
        cp "$TEMPLATE_DIR/.claude/agents/frontend-"*.md .claude/agents/ 2>/dev/null || true
        print_success "Installed fullstack agents"
        ;;
    library)
        cp "$TEMPLATE_DIR/.claude/agents/library-"*.md .claude/agents/ 2>/dev/null || true
        print_success "Installed library agents"
        ;;
esac

# Copy common agents
cp "$TEMPLATE_DIR/.claude/agents/test-"*.md .claude/agents/ 2>/dev/null || true
print_success "Installed common agents"

# Initialize Git if not already
print_header "Step 5: Git Initialization"
if [[ ! -d .git ]]; then
    git init
    print_success "Initialized Git repository"
    
    # Create .gitignore if doesn't exist
    if [[ ! -f .gitignore ]]; then
        cp "$TEMPLATE_DIR/.gitignore" .gitignore
        print_success "Created .gitignore"
    fi
else
    print_info "Git repository already exists"
fi

# Register with Orchestrator
if [[ "$SKIP_REGISTER" != true ]]; then
    print_header "Step 6: Orchestrator Registration"
    
    if command -v orchestrator &> /dev/null; then
        if orchestrator register "$PROJECT_NAME" --path="$PROJECT_PATH"; then
            print_success "Registered with Orchestrator"
        else
            print_warning "Registration failed (orchestrator command may not be installed)"
        fi
    else
        print_warning "orchestrator command not found. Install Orchestrator globally:"
        print_info "  npm install -g orchestrator-project"
    fi
else
    print_info "Skipped Orchestrator registration"
fi

# Initialize Taskmaster
if [[ "$SKIP_TASKMASTER" != true ]]; then
    print_header "Step 7: Taskmaster Initialization"
    
    if command -v task-master &> /dev/null; then
        if task-master init --name="$PROJECT_NAME" -y; then
            print_success "Initialized Taskmaster"
            
            # Copy example PRD
            cp "$TEMPLATE_DIR/.taskmaster/docs/example-prd.txt" .taskmaster/docs/
            print_success "Copied example PRD template"
        else
            print_warning "Taskmaster initialization failed"
        fi
    else
        print_warning "task-master command not found. Install Taskmaster:"
        print_info "  npm install -g task-master-ai"
    fi
else
    print_info "Skipped Taskmaster initialization"
fi

# Create initial commit
print_header "Step 8: Initial Commit"
git add .
git commit -m "chore: initialize project with Orchestrator infrastructure

- Added diet103 infrastructure patterns
- Configured skill auto-activation
- Set up Taskmaster integration
- Project type: $PROJECT_TYPE
- Skills: $SKILLS" 2>/dev/null || print_info "No changes to commit"

# Success summary
print_header "✨ Setup Complete!"
cat << EOF
${GREEN}Your project is ready!${NC}

${YELLOW}Next Steps:${NC}

1. Read the workflow guide:
   ${BLUE}cat DAILY_WORKFLOW.md${NC}

2. Verify setup:
   ${BLUE}orchestrator current${NC}

3. Start working:
   ${BLUE}task-master next${NC}

4. (Optional) Create a PRD and generate tasks:
   ${BLUE}# Edit .taskmaster/docs/example-prd.txt${NC}
   ${BLUE}task-master parse-prd .taskmaster/docs/example-prd.txt${NC}

${YELLOW}Useful Commands:${NC}
   ${BLUE}orch where${NC}    - Show current project
   ${BLUE}orch next${NC}     - Get next task
   ${BLUE}orch help${NC}     - Show all commands

${YELLOW}Files Created:${NC}
   .claude/settings.json        - Hook & skill registration
   .claude/skill-rules.json     - Auto-activation triggers
   .claude/hooks/               - Skill activation logic
   .claude/skills/              - Installed skills
   .claude/agents/              - Specialized agents
   .taskmaster/                 - Task management
   DAILY_WORKFLOW.md            - Workflow reference
   README.md                    - Project overview

${GREEN}Happy coding! 🚀${NC}
EOF

