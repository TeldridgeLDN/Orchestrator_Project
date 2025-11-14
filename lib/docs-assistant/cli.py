"""
Documentation Assistant CLI

Command-line interface and hotkey integration.
"""

import click
import sys
import logging
from pathlib import Path
from typing import Optional

from .assistant import DocumentationAssistant
from .error_parser import ErrorParser
from .context_analyzer import ContextAnalyzer
from .indexer import DocumentationIndexer

logger = logging.getLogger(__name__)


@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
@click.option('--offline', is_flag=True, help='Enable offline mode')
@click.pass_context
def cli(ctx, verbose: bool, offline: bool):
    """
    Documentation Assistant - Context-aware documentation suggestions.
    
    Examples:
        docs-assist suggest "how to handle errors in python"
        docs-assist error "ValueError: invalid literal"
        docs-assist index ./docs
    """
    # Configure logging
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Store in context
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose
    ctx.obj['offline'] = offline


@cli.command()
@click.argument('query')
@click.option('--max-results', '-n', default=5, help='Maximum suggestions')
@click.option('--context-file', '-f', help='Current file for context')
@click.pass_context
def suggest(ctx, query: str, max_results: int, context_file: Optional[str]):
    """Get documentation suggestions."""
    assistant = DocumentationAssistant(offline_mode=ctx.obj['offline'])
    
    # Add file context if provided
    contexts = []
    if context_file:
        from .models import Context, ContextType
        contexts.append(Context(
            type=ContextType.FILE,
            value=context_file
        ))
    
    # Get suggestions
    result = assistant.suggest(query, contexts, max_results)
    
    # Display results
    click.echo(f"\n🔍 Query: {query}")
    click.echo(f"⚡ Response time: {result.response_time_ms:.1f}ms")
    click.echo(f"📊 Confidence: {result.confidence:.1%}\n")
    
    if not result.suggestions:
        click.echo("❌ No suggestions found")
        return
    
    for i, suggestion in enumerate(result.suggestions, 1):
        click.echo(f"\n{i}. {suggestion.title}")
        click.echo(f"   📖 {suggestion.source} | Relevance: {suggestion.relevance_score:.1%}")
        click.echo(f"   {suggestion.content[:200]}...")
        
        if suggestion.code_examples:
            click.echo(f"\n   💻 Example:")
            click.echo(f"   {suggestion.code_examples[0][:150]}...")


@cli.command()
@click.argument('error_text')
@click.pass_context
def error(ctx, error_text: str):
    """Parse error and suggest solutions."""
    parser = ErrorParser()
    parsed = parser.parse(error_text)
    
    if parsed:
        click.echo(f"\n🐛 Error Type: {parsed.error_type}")
        click.echo(f"📝 Message: {parsed.message}")
        
        if parsed.file_path:
            click.echo(f"📄 File: {parsed.file_path}:{parsed.line_number}")
        
        if parsed.language:
            click.echo(f"🔤 Language: {parsed.language}")
        
        # Extract keywords and search
        keywords = parser.extract_keywords(parsed)
        search_query = f"{parsed.error_type} {' '.join(keywords[:3])}"
        
        click.echo(f"\n🔍 Searching for solutions...")
        
        assistant = DocumentationAssistant(offline_mode=ctx.obj['offline'])
        result = assistant.suggest(search_query, max_results=3)
        
        if result.suggestions:
            click.echo(f"\n💡 Found {len(result.suggestions)} potential solutions:\n")
            for i, suggestion in enumerate(result.suggestions, 1):
                click.echo(f"{i}. {suggestion.title}")
                click.echo(f"   {suggestion.content[:150]}...\n")
        else:
            click.echo("\n❌ No solutions found")
    else:
        click.echo("❌ Could not parse error")


@cli.command()
@click.argument('directory', type=click.Path(exists=True))
@click.option('--patterns', '-p', multiple=True, help='File patterns (e.g., *.md)')
@click.pass_context
def index(ctx, directory: str, patterns: tuple):
    """Index documentation directory."""
    indexer = DocumentationIndexer()
    
    dir_path = Path(directory)
    pattern_list = list(patterns) if patterns else None
    
    click.echo(f"📚 Indexing {directory}...")
    
    count = indexer.index_directory(dir_path, pattern_list)
    
    click.echo(f"✅ Indexed {count} documents")


@cli.command()
@click.pass_context
def stats(ctx):
    """Show usage statistics."""
    assistant = DocumentationAssistant()
    stats = assistant.get_stats()
    
    click.echo("\n📊 Usage Statistics\n")
    click.echo(f"Total queries: {stats.total_queries}")
    click.echo(f"Total suggestions: {stats.total_suggestions}")
    click.echo(f"Acceptance rate: {stats.acceptance_rate:.1%}")
    click.echo(f"Avg response time: {stats.avg_response_time_ms:.1f}ms")
    click.echo(f"Avg relevance: {stats.avg_relevance_score:.1%}")


@cli.command()
@click.pass_context
def context(ctx):
    """Show current development context."""
    analyzer = ContextAnalyzer()
    contexts = analyzer.analyze()
    
    if not contexts:
        click.echo("❌ No context detected")
        return
    
    click.echo(f"\n📍 Detected {len(contexts)} contexts:\n")
    
    for ctx_item in contexts:
        click.echo(f"• {ctx_item.type.value}: {ctx_item.value}")
        if ctx_item.metadata:
            for key, val in ctx_item.metadata.items():
                click.echo(f"  {key}: {val}")


if __name__ == '__main__':
    cli()

