#!/bin/bash
# Orchestrator Shell Aliases Installer
# Adds convenient aliases to your shell config

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Detect shell
detect_shell() {
    if [ -n "$ZSH_VERSION" ]; then
        echo "zsh"
    elif [ -n "$BASH_VERSION" ]; then
        echo "bash"
    else
        # Check default shell
        case "$SHELL" in
            */zsh)
                echo "zsh"
                ;;
            */bash)
                echo "bash"
                ;;
            *)
                echo "unknown"
                ;;
        esac
    fi
}

get_config_file() {
    local shell_type=$1
    
    case $shell_type in
        zsh)
            echo "$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                echo "$HOME/.bashrc"
            else
                echo "$HOME/.bash_profile"
            fi
            ;;
        *)
            echo ""
            ;;
    esac
}

# Aliases to add
get_aliases() {
    local orch_project_path="$1"
    cat << EOF
# Orchestrator Aliases (added by setup-aliases.sh)
alias o="orch"
alias on="orch next"
alias ow="orch where"
alias od="orch done"
alias ol="orch log"
alias os="orch show"
alias olist="orch list"
alias oswitch="orch switch"
alias dashboard="node ${orch_project_path}/bin/dashboard"
EOF
}

# Main execution
print_header "Orchestrator Aliases Installer"

# Get Orchestrator project path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ORCH_PROJECT_PATH="$(dirname "$SCRIPT_DIR")"

# Detect shell
SHELL_TYPE=$(detect_shell)
CONFIG_FILE=$(get_config_file "$SHELL_TYPE")

if [ -z "$CONFIG_FILE" ]; then
    print_error "Could not detect shell type"
    echo ""
    echo "Please manually add these aliases to your shell config:"
    echo ""
    get_aliases "$ORCH_PROJECT_PATH"
    exit 1
fi

print_info "Detected shell: $SHELL_TYPE"
print_info "Config file: $CONFIG_FILE"
echo ""

# Check if aliases already exist
if grep -q "# Orchestrator Aliases" "$CONFIG_FILE" 2>/dev/null; then
    print_warning "Aliases already installed in $CONFIG_FILE"
    echo ""
    read -p "Do you want to reinstall (overwrites existing)? [y/N] " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    
    # Remove existing aliases
    print_info "Removing existing aliases..."
    sed -i.bak '/# Orchestrator Aliases/,/^$/d' "$CONFIG_FILE"
    print_success "Removed existing aliases"
fi

# Add aliases
print_info "Adding aliases to $CONFIG_FILE..."
echo "" >> "$CONFIG_FILE"
get_aliases "$ORCH_PROJECT_PATH" >> "$CONFIG_FILE"
echo "" >> "$CONFIG_FILE"
print_success "Aliases added successfully"

# Instructions
print_header "Installation Complete!"

cat << EOF
${GREEN}Aliases installed!${NC}

${YELLOW}Available Aliases:${NC}

  ${BLUE}o${NC}             - orch (main helper)
  ${BLUE}on${NC}            - orch next
  ${BLUE}ow${NC}            - orch where
  ${BLUE}od <id>${NC}       - orch done <id>
  ${BLUE}ol <id> <msg>${NC} - orch log <id> <msg>
  ${BLUE}os <id>${NC}       - orch show <id>
  ${BLUE}olist${NC}         - orch list
  ${BLUE}oswitch <name>${NC} - orch switch <name>
  ${BLUE}dashboard${NC}     - Open multi-project task dashboard

${YELLOW}Next Steps:${NC}

1. Reload your shell:
   ${BLUE}source $CONFIG_FILE${NC}

   Or close and reopen your terminal.

2. Test the aliases:
   ${BLUE}o help${NC}
   ${BLUE}on${NC}
   ${BLUE}ow${NC}

${YELLOW}Example Usage:${NC}

  ${BLUE}ow${NC}                              # Where am I?
  ${BLUE}on${NC}                              # What's next?
  ${BLUE}os 2.1${NC}                          # Show task 2.1
  ${BLUE}ol 2.1 "Completed feature"${NC}      # Log progress
  ${BLUE}od 2.1${NC}                          # Mark complete

${GREEN}Happy coding! 🚀${NC}
EOF

# Offer to reload shell
echo ""
read -p "Reload shell config now? [Y/n] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    case $SHELL_TYPE in
        zsh)
            print_info "Reloading zsh config..."
            # Can't actually reload in current shell, but inform user
            print_warning "Please run: source ~/.zshrc"
            print_warning "Or open a new terminal window"
            ;;
        bash)
            print_info "Reloading bash config..."
            print_warning "Please run: source $CONFIG_FILE"
            print_warning "Or open a new terminal window"
            ;;
    esac
fi

echo ""
print_success "Setup complete!"

