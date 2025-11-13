#!/usr/bin/env python3
"""
Documentation Generator CLI

Main entry point for the skill documentation generator.
"""

import sys
import argparse
import logging
from pathlib import Path

from doc_generator import DocGenerator
from config_manager import get_config


def setup_logging(level: str):
    """Setup logging configuration."""
    numeric_level = getattr(logging, level.upper(), None)
    if not isinstance(numeric_level, int):
        numeric_level = logging.INFO
    
    logging.basicConfig(
        level=numeric_level,
        format='%(levelname)s: %(message)s'
    )


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Generate documentation for Claude Code skills',
        epilog='Examples:\n'
               '  %(prog)s --all                         # Generate docs for all skills\n'
               '  %(prog)s --skill my-skill              # Generate docs for specific skill\n'
               '  %(prog)s --check-drift-all             # Check drift for all skills\n'
               '  %(prog)s --update-all --dry-run        # Preview incremental updates\n',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    # Generation commands
    generation_group = parser.add_argument_group('Generation')
    generation_group.add_argument('--skill', help='Generate for specific skill')
    generation_group.add_argument('--all', action='store_true', help='Generate for all skills')
    
    # Drift detection commands
    drift_group = parser.add_argument_group('Drift Detection')
    drift_group.add_argument('--check-drift', action='store_true', help='Check drift for specific skill (requires --skill)')
    drift_group.add_argument('--check-drift-all', action='store_true', help='Check drift for all skills')
    
    # Incremental update commands
    update_group = parser.add_argument_group('Incremental Updates')
    update_group.add_argument('--update', action='store_true', help='Update specific skill incrementally (requires --skill)')
    update_group.add_argument('--update-all', action='store_true', help='Update all skills incrementally')
    update_group.add_argument('--replace-all', action='store_true', help='Replace all sections (no preservation)')
    update_group.add_argument('--dry-run', action='store_true', help='Don\'t write to disk')
    
    # Configuration
    config_group = parser.add_argument_group('Configuration')
    config_group.add_argument('--output', help='Output directory')
    config_group.add_argument('--skills-dir', help='Skills directory')
    config_group.add_argument('--config', help='Config file path')
    
    # Options
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--quiet', '-q', action='store_true', help='Quiet mode (errors only)')
    parser.add_argument('--version', action='version', version='%(prog)s 1.0.0')
    
    args = parser.parse_args()
    
    # Setup logging
    if args.quiet:
        setup_logging('ERROR')
    elif args.verbose:
        setup_logging('DEBUG')
    else:
        setup_logging('INFO')
    
    # Load configuration
    config = get_config(Path(args.config) if args.config else None)
    
    # Initialize generator
    generator = DocGenerator(
        skills_dir=Path(args.skills_dir) if args.skills_dir else None
    )
    
    output_dir = Path(args.output) if args.output else None
    
    try:
        # Execute command
        if args.check_drift_all:
            reports = generator.check_drift_all(verbose=args.verbose)
            drift_count = sum(1 for r in reports if r.has_drift)
            print(f"\n📊 Drift Summary: {drift_count}/{len(reports)} skills have drift")
            sys.exit(0 if drift_count == 0 else 1)
        
        elif args.check_drift:
            if not args.skill:
                print("❌ Error: --skill required with --check-drift")
                sys.exit(1)
            skill_path = generator.skills_dir / args.skill
            report = generator.check_drift(skill_path, verbose=True)
            sys.exit(0 if not report.has_drift else 1)
        
        elif args.update_all:
            results = generator.update_all_incrementally(
                preserve_manual=not args.replace_all,
                dry_run=args.dry_run,
                verbose=args.verbose
            )
            success_count = sum(1 for r in results if r.success)
            print(f"\n✅ Updated {success_count}/{len(results)} skills")
            if args.dry_run:
                print("💾 Dry run - no files were modified")
            sys.exit(0 if success_count == len(results) else 1)
        
        elif args.update:
            if not args.skill:
                print("❌ Error: --skill required with --update")
                sys.exit(1)
            skill_path = generator.skills_dir / args.skill
            result = generator.update_incrementally(
                skill_path,
                preserve_manual=not args.replace_all,
                dry_run=args.dry_run,
                verbose=True
            )
            sys.exit(0 if result.success else 1)
        
        elif args.all:
            count = generator.generate_all(output_dir)
            print(f"\n✅ Generated documentation for {count} skills")
            sys.exit(0)
        
        elif args.skill:
            output_path = generator.generate_for_skill_name(args.skill, output_dir)
            print(f"\n✅ Generated: {output_path}")
            sys.exit(0)
        
        else:
            parser.print_help()
            sys.exit(1)
    
    except Exception as e:
        logging.error(f"Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

