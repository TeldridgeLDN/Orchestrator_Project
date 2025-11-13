"""
Documentation Generator

Main module for generating skill documentation from code and configuration.
"""

import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from jinja2 import Environment, FileSystemLoader, Template

from scanner import SkillDirectoryScanner
from metadata_extractor import MetadataExtractor
from parsers.python_parser import PythonParser
from parsers.typescript_parser import TypeScriptParser
from drift_detector import DriftDetector, DriftReport
from incremental_updater import IncrementalUpdater, MergeResult

logger = logging.getLogger(__name__)


class DocGenerator:
    """
    Main documentation generator that orchestrates scanning, parsing, and rendering.
    """
    
    def __init__(self, skills_dir: Optional[Path] = None, template_dir: Optional[Path] = None):
        """
        Initialize the documentation generator.
        
        Args:
            skills_dir: Directory containing skills (defaults to .claude/skills)
            template_dir: Directory containing Jinja2 templates (defaults to ./templates)
        """
        if skills_dir is None:
            self.skills_dir = Path.cwd() / '.claude' / 'skills'
        else:
            self.skills_dir = Path(skills_dir)
        
        if template_dir is None:
            self.template_dir = Path(__file__).parent / 'templates'
        else:
            self.template_dir = Path(template_dir)
        
        # Initialize components
        self.scanner = SkillDirectoryScanner(self.skills_dir)
        self.metadata_extractor = MetadataExtractor()
        self.python_parser = PythonParser()
        self.typescript_parser = TypeScriptParser()
        self.drift_detector = DriftDetector()
        self.incremental_updater = IncrementalUpdater()
        
        # Initialize Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def generate_all(self, output_dir: Optional[Path] = None) -> int:
        """
        Generate documentation for all skills.
        
        Args:
            output_dir: Directory to write generated docs (defaults to skill directories)
        
        Returns:
            Number of skills processed
        """
        skills = self.scanner.scan()
        
        if not skills:
            logger.warning(f"No skills found in {self.skills_dir}")
            return 0
        
        logger.info(f"Generating documentation for {len(skills)} skills...")
        
        success_count = 0
        for skill_path in skills:
            try:
                self.generate_for_skill(skill_path, output_dir)
                success_count += 1
                logger.info(f"✓ Generated docs for {skill_path.name}")
            except Exception as e:
                logger.error(f"✗ Error generating docs for {skill_path.name}: {e}")
        
        logger.info(f"Successfully generated docs for {success_count}/{len(skills)} skills")
        return success_count
    
    def generate_for_skill(self, skill_path: Path, output_dir: Optional[Path] = None) -> Path:
        """
        Generate documentation for a single skill.
        
        Args:
            skill_path: Path to the skill directory
            output_dir: Custom output directory (defaults to skill directory)
        
        Returns:
            Path to generated documentation file
        """
        # Extract metadata
        metadata = self.metadata_extractor.extract_from_skill_directory(skill_path)
        
        # Merge config into top-level metadata for template
        skill_data = {**metadata, **metadata.get('config', {})}
        
        # Parse Python modules for API reference
        python_modules = metadata.get('python_modules', [])
        
        # Parse TypeScript/JavaScript files if any
        ts_files = list(skill_path.rglob('*.ts')) + list(skill_path.rglob('*.js'))
        ts_modules = []
        for ts_file in ts_files:
            if '__pycache__' not in str(ts_file) and 'node_modules' not in str(ts_file):
                try:
                    ts_data = self.typescript_parser.parse_file(ts_file)
                    if not ts_data.get('error'):
                        ts_modules.append(ts_data)
                except Exception as e:
                    logger.warning(f"Could not parse {ts_file}: {e}")
        
        # Prepare template context
        context = {
            'skill': skill_data,
            'python_modules': python_modules,
            'typescript_modules': ts_modules
        }
        
        # Render template
        template = self.jinja_env.get_template('skill-template.md.j2')
        rendered = template.render(**context)
        
        # Write output
        if output_dir:
            output_path = Path(output_dir) / f"{skill_path.name}.md"
        else:
            output_path = skill_path / 'skill.md'
        
        output_path.write_text(rendered, encoding='utf-8')
        logger.info(f"Generated documentation: {output_path}")
        
        return output_path
    
    def generate_for_skill_name(self, skill_name: str, output_dir: Optional[Path] = None) -> Path:
        """
        Generate documentation for a skill by name.
        
        Args:
            skill_name: Name of the skill directory
            output_dir: Custom output directory
        
        Returns:
            Path to generated documentation file
        """
        skill_path = self.skills_dir / skill_name
        
        if not skill_path.exists():
            raise FileNotFoundError(f"Skill not found: {skill_name}")
        
        return self.generate_for_skill(skill_path, output_dir)
    
    def check_drift(self, skill_path: Path, verbose: bool = False) -> DriftReport:
        """
        Check for drift between generated docs and existing docs.
        
        Args:
            skill_path: Path to the skill directory
            verbose: Print detailed report
        
        Returns:
            Detailed drift report
        """
        existing_doc = skill_path / 'skill.md'
        
        # Generate fresh docs to temp location
        import tempfile
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            generated_doc = self.generate_for_skill(skill_path, temp_path)
            
            # Use drift detector for detailed analysis
            report = self.drift_detector.detect(
                existing_doc,
                generated_doc,
                skill_path.name
            )
            
            if verbose:
                self.drift_detector.print_report(report)
            
            return report
    
    def check_drift_all(self, verbose: bool = False) -> List[DriftReport]:
        """
        Check drift for all skills.
        
        Args:
            verbose: Print detailed reports
        
        Returns:
            List of drift reports for all skills
        """
        skills = self.scanner.scan()
        reports = []
        
        logger.info(f"Checking drift for {len(skills)} skills...")
        
        for skill_path in skills:
            try:
                report = self.check_drift(skill_path, verbose=False)
                reports.append(report)
                
                if report.has_drift:
                    logger.warning(f"⚠️  {skill_path.name}: DRIFT DETECTED")
                else:
                    logger.info(f"✓ {skill_path.name}: Up to date")
            except Exception as e:
                logger.error(f"✗ Error checking {skill_path.name}: {e}")
        
        # Summary
        drift_count = sum(1 for r in reports if r.has_drift)
        logger.info(f"\n📊 Summary: {drift_count}/{len(reports)} skills have drift")
        
        if verbose:
            for report in reports:
                if report.has_drift:
                    self.drift_detector.print_report(report)
        
        return reports
    
    def update_incrementally(
        self,
        skill_path: Path,
        preserve_manual: bool = True,
        dry_run: bool = False,
        verbose: bool = False
    ) -> MergeResult:
        """
        Update skill documentation incrementally, preserving manual edits.
        
        Args:
            skill_path: Path to the skill directory
            preserve_manual: Preserve existing content (assume manual edits)
            dry_run: Don't write to disk
            verbose: Print detailed report
        
        Returns:
            MergeResult with merge details
        """
        existing_doc = skill_path / 'skill.md'
        
        # Generate fresh docs to temp location
        import tempfile
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            generated_doc = self.generate_for_skill(skill_path, temp_path)
            
            # Perform incremental merge
            result = self.incremental_updater.merge(
                existing_doc,
                generated_doc,
                output_path=existing_doc if not dry_run else None,
                skill_name=skill_path.name,
                preserve_all_manual=preserve_manual,
                dry_run=dry_run
            )
            
            if verbose:
                self.incremental_updater.print_result(result, verbose=True)
            
            return result
    
    def update_all_incrementally(
        self,
        preserve_manual: bool = True,
        dry_run: bool = False,
        verbose: bool = False
    ) -> List[MergeResult]:
        """
        Update all skills incrementally.
        
        Args:
            preserve_manual: Preserve existing content
            dry_run: Don't write to disk
            verbose: Print detailed reports
        
        Returns:
            List of merge results
        """
        skills = self.scanner.scan()
        results = []
        
        logger.info(f"Updating {len(skills)} skills incrementally...")
        
        for skill_path in skills:
            try:
                result = self.update_incrementally(
                    skill_path,
                    preserve_manual=preserve_manual,
                    dry_run=dry_run,
                    verbose=False
                )
                results.append(result)
                
                if result.success:
                    logger.info(f"✓ Updated {skill_path.name} ({result.sections_updated} sections)")
                else:
                    logger.error(f"✗ Failed to update {skill_path.name}")
            except Exception as e:
                logger.error(f"✗ Error updating {skill_path.name}: {e}")
        
        # Summary
        success_count = sum(1 for r in results if r.success)
        logger.info(f"\n📊 Summary: Successfully updated {success_count}/{len(results)} skills")
        
        if verbose:
            for result in results:
                self.incremental_updater.print_result(result, verbose=True)
        
        return results


def main():
    """CLI entry point for documentation generator."""
    import sys
    import argparse
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Generate skill documentation')
    parser.add_argument('--skill', help='Generate for specific skill')
    parser.add_argument('--all', action='store_true', help='Generate for all skills')
    parser.add_argument('--check-drift', action='store_true', help='Check for documentation drift')
    parser.add_argument('--check-drift-all', action='store_true', help='Check drift for all skills')
    parser.add_argument('--update', action='store_true', help='Update specific skill incrementally')
    parser.add_argument('--update-all', action='store_true', help='Update all skills incrementally')
    parser.add_argument('--replace-all', action='store_true', help='Replace all sections (no preservation)')
    parser.add_argument('--dry-run', action='store_true', help='Don\'t write to disk')
    parser.add_argument('--output', help='Output directory')
    parser.add_argument('--skills-dir', help='Skills directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Initialize generator
    generator = DocGenerator(
        skills_dir=args.skills_dir if args.skills_dir else None
    )
    
    output_dir = Path(args.output) if args.output else None
    
    # Execute command
    if args.check_drift_all:
        reports = generator.check_drift_all(verbose=args.verbose)
        drift_count = sum(1 for r in reports if r.has_drift)
        print(f"\n📊 Drift Summary: {drift_count}/{len(reports)} skills have drift")
        sys.exit(0 if drift_count == 0 else 1)
    
    elif args.check_drift:
        if args.skill:
            skill_path = generator.skills_dir / args.skill
            report = generator.check_drift(skill_path, verbose=True)
            sys.exit(0 if not report.has_drift else 1)
        else:
            print("Error: --skill required with --check-drift")
            sys.exit(1)
    
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
        if args.skill:
            skill_path = generator.skills_dir / args.skill
            result = generator.update_incrementally(
                skill_path,
                preserve_manual=not args.replace_all,
                dry_run=args.dry_run,
                verbose=True
            )
            sys.exit(0 if result.success else 1)
        else:
            print("Error: --skill required with --update")
            sys.exit(1)
    
    elif args.all:
        count = generator.generate_all(output_dir)
        print(f"\n✅ Generated documentation for {count} skills")
    
    elif args.skill:
        try:
            output_path = generator.generate_for_skill_name(args.skill, output_dir)
            print(f"\n✅ Generated: {output_path}")
        except FileNotFoundError as e:
            print(f"\n❌ Error: {e}")
            sys.exit(1)
    
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()

