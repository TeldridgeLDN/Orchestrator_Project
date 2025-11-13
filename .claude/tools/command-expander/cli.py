#!/usr/bin/env python3
"""
Command Template Expander CLI

A CLI tool for expanding command templates with variable substitution.
"""

import sys
import click
from pathlib import Path
from typing import Optional, Dict, Any

from template_loader import load_workflow, load_templates, get_template_by_name, get_template_by_alias
from expander import CommandExpander, expand_template, preview_template


# ===== CLI Context =====

class CLIContext:
    """Shared context for CLI commands."""
    def __init__(self):
        self.templates_dir = Path(__file__).parent / 'templates'
        self.workflows = []
        self.expander = CommandExpander()
    
    def load_workflows(self):
        """Load all workflows from templates directory."""
        if not self.workflows:
            self.workflows = load_templates(str(self.templates_dir))
        return self.workflows


pass_context = click.make_pass_decorator(CLIContext, ensure=True)


# ===== Main CLI Group =====

@click.group()
@click.version_option(version='1.0.0', prog_name='command-expander')
@click.pass_context
def cli(ctx):
    """
    Command Template Expander
    
    Expand command templates with variable substitution,
    validation, and interactive prompts.
    
    Examples:
        tmx list                    # List all templates
        tmx expand commit           # Expand commit template
        tmx run test --path=tests/  # Expand and execute template
    """
    ctx.obj = CLIContext()


# ===== List Command =====

@cli.command()
@click.option('--workflow', '-w', help='Filter by workflow name')
@click.option('--verbose', '-v', is_flag=True, help='Show detailed information')
@pass_context
def list(ctx, workflow, verbose):
    """List available templates."""
    workflows = ctx.load_workflows()
    
    if not workflows:
        click.echo("No templates found.")
        return
    
    if workflow:
        # Filter to specific workflow
        workflows = [w for w in workflows if w.name == workflow]
        if not workflows:
            click.echo(f"Workflow '{workflow}' not found.", err=True)
            sys.exit(1)
    
    for wf in workflows:
        click.echo(f"\n{click.style(wf.name, fg='cyan', bold=True)}")
        if wf.description:
            click.echo(f"  {wf.description}")
        
        for template in wf.templates:
            # Template name with aliases
            name_str = template.name
            if template.aliases:
                name_str += f" ({', '.join(template.aliases)})"
            
            click.echo(f"\n  {click.style(name_str, fg='green')}")
            click.echo(f"    {template.description}")
            
            if verbose:
                # Show command template
                click.echo(f"    Command: {click.style(template.command, dim=True)}")
                
                # Show variables
                if template.variables:
                    click.echo("    Variables:")
                    for var in template.variables:
                        required_str = "required" if var.required else "optional"
                        default_str = f", default={var.default}" if var.default is not None else ""
                        click.echo(f"      - {var.name} ({var.type}, {required_str}{default_str})")
                        click.echo(f"        {var.description}")
                
                # Show safety flags
                if template.safety.get('dangerous'):
                    click.echo(f"    {click.style('⚠️  Dangerous command', fg='red')}")


# ===== Expand Command =====

@cli.command()
@click.argument('template_name')
@click.option('--var', '-v', multiple=True, help='Variable in format name=value')
@click.option('--workflow', '-w', help='Workflow name (if ambiguous)')
@click.option('--dry-run', is_flag=True, help='Show preview without execution')
@pass_context
def expand(ctx, template_name, var, workflow, dry_run):
    """
    Expand a template with variables.
    
    Examples:
        tmx expand commit --var message="feat: add feature"
        tmx expand test --var path=tests/unit --var verbose=true
    """
    # Parse variables
    variables = {}
    for v in var:
        if '=' not in v:
            click.echo(f"Invalid variable format: {v}. Use name=value", err=True)
            sys.exit(1)
        name, value = v.split('=', 1)
        variables[name.strip()] = value.strip()
    
    # Find template
    template = _find_template(ctx, template_name, workflow)
    if not template:
        sys.exit(1)
    
    # Expand template
    result = ctx.expander.expand(template, variables)
    
    if not result.success:
        click.echo(click.style("✗ Expansion failed:", fg='red', bold=True))
        for error in result.errors:
            click.echo(f"  {error}", err=True)
        sys.exit(1)
    
    # Show warnings
    if result.warnings:
        for warning in result.warnings:
            click.echo(click.style(f"⚠️  {warning}", fg='yellow'))
    
    # Show result
    click.echo(click.style("\n✓ Expanded command:", fg='green', bold=True))
    click.echo(f"  {result.command}")
    
    if dry_run:
        click.echo(click.style("\n(Dry-run mode - command not executed)", dim=True))


# ===== Run Command =====

@cli.command()
@click.argument('template_name')
@click.option('--var', '-v', multiple=True, help='Variable in format name=value')
@click.option('--workflow', '-w', help='Workflow name (if ambiguous)')
@click.option('--dry-run', is_flag=True, help='Show preview without execution')
@click.option('--yes', '-y', is_flag=True, help='Skip confirmation prompt')
@pass_context
def run(ctx, template_name, var, workflow, dry_run, yes):
    """
    Expand and execute a template command.
    
    Examples:
        tmx run commit --var message="feat: new feature"
        tmx run test --var path=tests/ --yes
    """
    import subprocess
    
    # Parse variables
    variables = {}
    for v in var:
        if '=' not in v:
            click.echo(f"Invalid variable format: {v}. Use name=value", err=True)
            sys.exit(1)
        name, value = v.split('=', 1)
        variables[name.strip()] = value.strip()
    
    # Find template
    template = _find_template(ctx, template_name, workflow)
    if not template:
        sys.exit(1)
    
    # Expand template
    result = ctx.expander.expand(template, variables)
    
    if not result.success:
        click.echo(click.style("✗ Expansion failed:", fg='red', bold=True))
        for error in result.errors:
            click.echo(f"  {error}", err=True)
        sys.exit(1)
    
    # Show warnings
    if result.warnings:
        for warning in result.warnings:
            click.echo(click.style(f"⚠️  {warning}", fg='yellow'))
    
    # Show command
    click.echo(click.style("\nExpanded command:", fg='green', bold=True))
    click.echo(f"  {result.command}\n")
    
    if dry_run:
        click.echo(click.style("(Dry-run mode - command not executed)", dim=True))
        return
    
    # Check if dangerous
    is_dangerous = template.safety.get('dangerous', False)
    needs_confirm = template.safety.get('confirm', False) or is_dangerous
    
    if is_dangerous:
        click.echo(click.style("⚠️  Warning: This is a dangerous command!", fg='red', bold=True))
    
    # Confirm execution
    if needs_confirm and not yes:
        if not click.confirm("Execute this command?"):
            click.echo("Cancelled.")
            return
    
    # Execute
    try:
        click.echo(click.style("\nExecuting...", dim=True))
        result_code = subprocess.run(
            result.command,
            shell=True,
            check=False
        )
        
        if result_code.returncode == 0:
            click.echo(click.style("\n✓ Command executed successfully", fg='green'))
        else:
            click.echo(click.style(f"\n✗ Command failed with exit code {result_code.returncode}", fg='red'))
            sys.exit(result_code.returncode)
    
    except Exception as e:
        click.echo(click.style(f"\n✗ Execution error: {e}", fg='red'), err=True)
        sys.exit(1)


# ===== Show Command =====

@cli.command()
@click.argument('template_name')
@click.option('--workflow', '-w', help='Workflow name (if ambiguous)')
@pass_context
def show(ctx, template_name, workflow):
    """Show detailed information about a template."""
    template = _find_template(ctx, template_name, workflow)
    if not template:
        sys.exit(1)
    
    # Template header
    click.echo(f"\n{click.style(template.name, fg='cyan', bold=True)}")
    click.echo(f"Workflow: {template.workflow}")
    click.echo(f"Description: {template.description}")
    
    # Aliases
    if template.aliases:
        click.echo(f"Aliases: {', '.join(template.aliases)}")
    
    # Safety flags
    if template.safety.get('dangerous'):
        click.echo(click.style("⚠️  Dangerous command - requires confirmation", fg='red'))
    
    # Command template
    click.echo(f"\n{click.style('Command Template:', bold=True)}")
    click.echo(f"  {template.command}")
    
    # Variables
    if template.variables:
        click.echo(f"\n{click.style('Variables:', bold=True)}")
        for var in template.variables:
            # Variable header
            required_badge = click.style("required", fg='red') if var.required else click.style("optional", fg='green')
            click.echo(f"\n  {click.style(var.name, bold=True)} ({var.type}, {required_badge})")
            click.echo(f"  {var.description}")
            
            # Default value
            if var.default is not None:
                click.echo(f"    Default: {var.default}")
            
            # Constraints
            if var.options:
                click.echo(f"    Options: {', '.join(map(str, var.options))}")
            if var.pattern:
                click.echo(f"    Pattern: {var.pattern}")
            if var.min is not None or var.max is not None:
                range_str = f"{var.min or '∞'} to {var.max or '∞'}"
                click.echo(f"    Range: {range_str}")
    
    # Examples
    if template.examples:
        click.echo(f"\n{click.style('Examples:', bold=True)}")
        for example in template.examples:
            click.echo(f"  {example}")


# ===== Workflows Command =====

@cli.command()
@pass_context
def workflows(ctx):
    """List all available workflows."""
    workflows_list = ctx.load_workflows()
    
    if not workflows_list:
        click.echo("No workflows found.")
        return
    
    click.echo(click.style("\nAvailable Workflows:", bold=True))
    for wf in workflows_list:
        template_count = len(wf.templates)
        click.echo(f"\n  {click.style(wf.name, fg='cyan')}")
        click.echo(f"    {wf.description}")
        click.echo(f"    {template_count} template(s)")


# ===== Helper Functions =====

def _find_template(ctx: CLIContext, name: str, workflow_name: Optional[str] = None):
    """Find a template by name or alias."""
    workflows = ctx.load_workflows()
    
    # If workflow specified, search only in that workflow
    if workflow_name:
        target_workflows = [w for w in workflows if w.name == workflow_name]
        if not target_workflows:
            click.echo(f"Workflow '{workflow_name}' not found.", err=True)
            return None
        workflows = target_workflows
    
    # Search by name first, then by alias
    found_templates = []
    for wf in workflows:
        # Try exact name match
        template = get_template_by_name(wf, name)
        if template:
            found_templates.append((wf, template))
        
        # Try alias match
        template = get_template_by_alias(wf, name)
        if template and (wf, template) not in found_templates:
            found_templates.append((wf, template))
    
    if not found_templates:
        click.echo(f"Template '{name}' not found.", err=True)
        click.echo("Use 'tmx list' to see available templates.")
        return None
    
    if len(found_templates) > 1:
        click.echo(f"Template name '{name}' is ambiguous. Found in:", err=True)
        for wf, template in found_templates:
            click.echo(f"  - {wf.name}/{template.name}", err=True)
        click.echo("Use --workflow to specify which one.", err=True)
        return None
    
    return found_templates[0][1]


# ===== Main Entry Point =====

def main():
    """Main entry point for CLI."""
    try:
        cli()
    except KeyboardInterrupt:
        click.echo("\n\nInterrupted.", err=True)
        sys.exit(130)
    except Exception as e:
        click.echo(f"\nError: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

