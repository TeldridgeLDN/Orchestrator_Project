"""
Drift Detector

Advanced drift detection and diffing for documentation changes.
Compares generated documentation with existing documentation and provides detailed change reports.
"""

import difflib
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class DriftReport:
    """Detailed report of documentation drift."""
    
    skill_name: str
    has_drift: bool
    reason: str
    action: str  # 'none', 'generate', 'update'
    
    # File statistics
    existing_lines: Optional[int] = None
    generated_lines: Optional[int] = None
    existing_size: Optional[int] = None
    generated_size: Optional[int] = None
    
    # Change details
    added_lines: int = 0
    removed_lines: int = 0
    modified_lines: int = 0
    unchanged_lines: int = 0
    
    # Drift breakdown by section
    section_changes: Dict[str, str] = field(default_factory=dict)  # section -> change_type
    
    # Diff details
    unified_diff: Optional[str] = None
    html_diff: Optional[str] = None
    
    # Timestamps
    checked_at: datetime = field(default_factory=datetime.now)
    existing_modified: Optional[datetime] = None
    
    # Recommendations
    recommendations: List[str] = field(default_factory=list)


class DriftDetector:
    """
    Advanced drift detector for skill documentation.
    
    Features:
    - Line-by-line comparison using difflib
    - Section-level drift analysis
    - Unified and HTML diff generation
    - Change statistics and metrics
    - Smart recommendations
    """
    
    def __init__(self):
        self.section_markers = [
            '## Overview',
            '## Capabilities',
            '## Dependencies',
            '## Configuration',
            '## File Structure',
            '## API Reference',
            '## Usage',
            '## Testing',
            '## Documentation',
            '## License'
        ]
    
    def detect(
        self,
        existing_path: Path,
        generated_path: Path,
        skill_name: Optional[str] = None
    ) -> DriftReport:
        """
        Detect drift between existing and generated documentation.
        
        Args:
            existing_path: Path to existing documentation
            generated_path: Path to generated documentation
            skill_name: Name of the skill (for reporting)
        
        Returns:
            Detailed drift report
        """
        skill_name = skill_name or existing_path.parent.name
        
        # Check if existing doc exists
        if not existing_path.exists():
            return DriftReport(
                skill_name=skill_name,
                has_drift=True,
                reason='No existing documentation',
                action='generate',
                generated_lines=self._count_lines(generated_path),
                generated_size=self._get_file_size(generated_path),
                recommendations=[
                    'Create new documentation file',
                    'Review generated content for accuracy'
                ]
            )
        
        # Read both files
        existing_content = existing_path.read_text(encoding='utf-8')
        generated_content = generated_path.read_text(encoding='utf-8')
        
        existing_lines = existing_content.splitlines()
        generated_lines = generated_content.splitlines()
        
        # Quick check for identical content
        if existing_content.strip() == generated_content.strip():
            return DriftReport(
                skill_name=skill_name,
                has_drift=False,
                reason='Documentation is up to date',
                action='none',
                existing_lines=len(existing_lines),
                generated_lines=len(generated_lines),
                existing_size=self._get_file_size(existing_path),
                generated_size=self._get_file_size(generated_path),
                unchanged_lines=len(existing_lines),
                existing_modified=self._get_modified_time(existing_path)
            )
        
        # Perform detailed diff analysis
        diff_stats = self._analyze_diff(existing_lines, generated_lines)
        section_changes = self._analyze_section_changes(existing_lines, generated_lines)
        
        # Generate diff outputs
        unified_diff = self._generate_unified_diff(
            existing_lines, generated_lines,
            existing_path.name, generated_path.name
        )
        html_diff = self._generate_html_diff(
            existing_lines, generated_lines,
            existing_path.name, generated_path.name
        )
        
        # Determine recommendations
        recommendations = self._generate_recommendations(
            diff_stats, section_changes, existing_lines, generated_lines
        )
        
        return DriftReport(
            skill_name=skill_name,
            has_drift=True,
            reason='Generated documentation differs from existing',
            action='update',
            existing_lines=len(existing_lines),
            generated_lines=len(generated_lines),
            existing_size=self._get_file_size(existing_path),
            generated_size=self._get_file_size(generated_path),
            added_lines=diff_stats['added'],
            removed_lines=diff_stats['removed'],
            modified_lines=diff_stats['modified'],
            unchanged_lines=diff_stats['unchanged'],
            section_changes=section_changes,
            unified_diff=unified_diff,
            html_diff=html_diff,
            existing_modified=self._get_modified_time(existing_path),
            recommendations=recommendations
        )
    
    def detect_batch(
        self,
        skills_dir: Path,
        output_dir: Optional[Path] = None
    ) -> List[DriftReport]:
        """
        Detect drift for all skills in a directory.
        
        Args:
            skills_dir: Directory containing skill directories
            output_dir: Directory with generated docs (defaults to skill directories)
        
        Returns:
            List of drift reports for all skills
        """
        reports = []
        
        for skill_dir in skills_dir.iterdir():
            if not skill_dir.is_dir() or skill_dir.name.startswith('.'):
                continue
            
            existing_path = skill_dir / 'skill.md'
            
            if output_dir:
                generated_path = output_dir / f"{skill_dir.name}.md"
            else:
                generated_path = existing_path  # Would need temp generation
            
            if not generated_path.exists():
                continue
            
            try:
                report = self.detect(existing_path, generated_path, skill_dir.name)
                reports.append(report)
            except Exception as e:
                logger.error(f"Error detecting drift for {skill_dir.name}: {e}")
        
        return reports
    
    def _analyze_diff(self, existing_lines: List[str], generated_lines: List[str]) -> Dict[str, int]:
        """
        Analyze line-by-line differences.
        
        Returns:
            Dictionary with counts of added, removed, modified, unchanged lines
        """
        differ = difflib.Differ()
        diff = list(differ.compare(existing_lines, generated_lines))
        
        added = sum(1 for line in diff if line.startswith('+ '))
        removed = sum(1 for line in diff if line.startswith('- '))
        unchanged = sum(1 for line in diff if line.startswith('  '))
        
        # Modified lines are approximated (removed + added in same context)
        # This is a simplified heuristic
        modified = min(added, removed)
        
        return {
            'added': added,
            'removed': removed,
            'modified': modified,
            'unchanged': unchanged
        }
    
    def _analyze_section_changes(
        self,
        existing_lines: List[str],
        generated_lines: List[str]
    ) -> Dict[str, str]:
        """
        Analyze which documentation sections have changed.
        
        Returns:
            Dictionary mapping section name to change type
        """
        section_changes = {}
        
        existing_sections = self._extract_sections(existing_lines)
        generated_sections = self._extract_sections(generated_lines)
        
        all_sections = set(existing_sections.keys()) | set(generated_sections.keys())
        
        for section in all_sections:
            existing_content = existing_sections.get(section, [])
            generated_content = generated_sections.get(section, [])
            
            if not existing_content and generated_content:
                section_changes[section] = 'added'
            elif existing_content and not generated_content:
                section_changes[section] = 'removed'
            elif existing_content != generated_content:
                section_changes[section] = 'modified'
            # else: unchanged, not recorded
        
        return section_changes
    
    def _extract_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        """
        Extract content by documentation section.
        
        Returns:
            Dictionary mapping section header to content lines
        """
        sections = {}
        current_section = None
        current_content = []
        
        for line in lines:
            # Check if this is a section marker
            is_section = False
            for marker in self.section_markers:
                if line.strip().startswith(marker):
                    # Save previous section
                    if current_section:
                        sections[current_section] = current_content
                    
                    # Start new section
                    current_section = marker
                    current_content = []
                    is_section = True
                    break
            
            if not is_section and current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = current_content
        
        return sections
    
    def _generate_unified_diff(
        self,
        existing_lines: List[str],
        generated_lines: List[str],
        existing_name: str,
        generated_name: str
    ) -> str:
        """Generate unified diff format."""
        diff = difflib.unified_diff(
            existing_lines,
            generated_lines,
            fromfile=existing_name,
            tofile=generated_name,
            lineterm=''
        )
        return '\n'.join(diff)
    
    def _generate_html_diff(
        self,
        existing_lines: List[str],
        generated_lines: List[str],
        existing_name: str,
        generated_name: str
    ) -> str:
        """Generate HTML diff format."""
        differ = difflib.HtmlDiff()
        return differ.make_file(
            existing_lines,
            generated_lines,
            fromdesc=existing_name,
            todesc=generated_name
        )
    
    def _generate_recommendations(
        self,
        diff_stats: Dict[str, int],
        section_changes: Dict[str, str],
        existing_lines: List[str],
        generated_lines: List[str]
    ) -> List[str]:
        """
        Generate smart recommendations based on drift analysis.
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        total_changes = diff_stats['added'] + diff_stats['removed']
        total_lines = len(existing_lines)
        
        # Major vs minor changes
        if total_lines > 0:
            change_ratio = total_changes / total_lines
            
            if change_ratio > 0.5:
                recommendations.append('Major changes detected - review entire document')
            elif change_ratio > 0.2:
                recommendations.append('Moderate changes detected - careful review recommended')
            else:
                recommendations.append('Minor changes detected - quick review sufficient')
        
        # Section-specific recommendations
        if 'added' in [section_changes.get(s) for s in section_changes]:
            recommendations.append('New sections added - verify completeness')
        
        if 'removed' in [section_changes.get(s) for s in section_changes]:
            recommendations.append('Sections removed - ensure intentional')
        
        api_sections = [s for s in section_changes if 'API' in s]
        if api_sections and any(section_changes[s] == 'modified' for s in api_sections):
            recommendations.append('API documentation changed - verify accuracy')
        
        # Size-based recommendations
        if diff_stats['added'] > diff_stats['removed'] * 2:
            recommendations.append('Documentation significantly expanded')
        elif diff_stats['removed'] > diff_stats['added'] * 2:
            recommendations.append('Documentation significantly reduced')
        
        return recommendations
    
    @staticmethod
    def _count_lines(path: Path) -> int:
        """Count lines in a file."""
        try:
            return len(path.read_text(encoding='utf-8').splitlines())
        except Exception:
            return 0
    
    @staticmethod
    def _get_file_size(path: Path) -> int:
        """Get file size in bytes."""
        try:
            return path.stat().st_size
        except Exception:
            return 0
    
    @staticmethod
    def _get_modified_time(path: Path) -> Optional[datetime]:
        """Get file modification time."""
        try:
            return datetime.fromtimestamp(path.stat().st_mtime)
        except Exception:
            return None
    
    def print_report(self, report: DriftReport, verbose: bool = False):
        """
        Print a formatted drift report.
        
        Args:
            report: The drift report to print
            verbose: Include detailed diff output
        """
        print(f"\n{'='*60}")
        print(f"📋 Drift Report: {report.skill_name}")
        print(f"{'='*60}")
        
        print(f"\n🔍 Status: {'⚠️  DRIFT DETECTED' if report.has_drift else '✅ UP TO DATE'}")
        print(f"   Reason: {report.reason}")
        print(f"   Action: {report.action.upper()}")
        
        if report.has_drift:
            print(f"\n📊 Statistics:")
            if report.existing_lines:
                print(f"   Existing: {report.existing_lines} lines ({report.existing_size} bytes)")
            if report.generated_lines:
                print(f"   Generated: {report.generated_lines} lines ({report.generated_size} bytes)")
            
            if report.added_lines or report.removed_lines:
                print(f"\n📝 Changes:")
                print(f"   Added:    {report.added_lines} lines")
                print(f"   Removed:  {report.removed_lines} lines")
                print(f"   Modified: {report.modified_lines} lines")
                print(f"   Unchanged: {report.unchanged_lines} lines")
            
            if report.section_changes:
                print(f"\n📑 Section Changes:")
                for section, change_type in report.section_changes.items():
                    icon = {'added': '➕', 'removed': '➖', 'modified': '✏️ '}[change_type]
                    print(f"   {icon} {section}: {change_type}")
            
            if report.recommendations:
                print(f"\n💡 Recommendations:")
                for rec in report.recommendations:
                    print(f"   • {rec}")
        
        if verbose and report.unified_diff:
            print(f"\n📄 Unified Diff:")
            print(report.unified_diff)
        
        print(f"\n{'='*60}\n")


def main():
    """CLI entry point for drift detection."""
    import sys
    import argparse
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    parser = argparse.ArgumentParser(description='Detect documentation drift')
    parser.add_argument('existing', help='Path to existing documentation')
    parser.add_argument('generated', help='Path to generated documentation')
    parser.add_argument('--skill-name', help='Name of the skill')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed diff')
    parser.add_argument('--save-html', help='Save HTML diff to file')
    parser.add_argument('--save-unified', help='Save unified diff to file')
    
    args = parser.parse_args()
    
    detector = DriftDetector()
    
    existing_path = Path(args.existing)
    generated_path = Path(args.generated)
    
    if not generated_path.exists():
        print(f"❌ Error: Generated file not found: {generated_path}")
        sys.exit(1)
    
    # Detect drift
    report = detector.detect(existing_path, generated_path, args.skill_name)
    
    # Print report
    detector.print_report(report, verbose=args.verbose)
    
    # Save outputs if requested
    if args.save_html and report.html_diff:
        html_path = Path(args.save_html)
        html_path.write_text(report.html_diff, encoding='utf-8')
        print(f"💾 Saved HTML diff to {html_path}")
    
    if args.save_unified and report.unified_diff:
        unified_path = Path(args.save_unified)
        unified_path.write_text(report.unified_diff, encoding='utf-8')
        print(f"💾 Saved unified diff to {unified_path}")
    
    # Exit with appropriate code
    sys.exit(0 if not report.has_drift else 1)


if __name__ == '__main__':
    main()

