"""
Incremental Updater

Merges generated documentation changes while preserving manual edits.
Uses smart section-based merging and manual edit detection.
"""

import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)

# Special markers for manual edit zones
MANUAL_EDIT_START = '<!-- MANUAL EDIT START -->'
MANUAL_EDIT_END = '<!-- MANUAL EDIT END -->'
AUTO_GENERATED_MARKER = '<!-- AUTO-GENERATED: DO NOT EDIT -->'


@dataclass
class MergeResult:
    """Result of merging generated and existing documentation."""
    
    skill_name: str
    success: bool
    merged_content: str
    
    # Statistics
    sections_updated: int = 0
    sections_preserved: int = 0
    manual_edits_preserved: int = 0
    
    # Details
    updated_sections: List[str] = field(default_factory=list)
    preserved_sections: List[str] = field(default_factory=list)
    manual_edit_zones: List[Tuple[int, int]] = field(default_factory=list)  # (start_line, end_line)
    
    # Messages
    warnings: List[str] = field(default_factory=list)
    info: List[str] = field(default_factory=list)
    
    merged_at: datetime = field(default_factory=datetime.now)


class IncrementalUpdater:
    """
    Smart documentation updater that preserves manual edits.
    
    Features:
    - Section-based merging strategy
    - Manual edit zone detection and preservation
    - Auto-generated section replacement
    - Conflict detection and warnings
    - Safe merge with rollback capability
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
    
    def merge(
        self,
        existing_path: Path,
        generated_path: Path,
        output_path: Optional[Path] = None,
        skill_name: Optional[str] = None,
        preserve_all_manual: bool = True,
        dry_run: bool = False
    ) -> MergeResult:
        """
        Merge generated documentation with existing, preserving manual edits.
        
        Args:
            existing_path: Path to existing documentation
            generated_path: Path to generated documentation
            output_path: Where to write merged result (defaults to existing_path)
            skill_name: Name of the skill
            preserve_all_manual: Preserve all content not auto-generated
            dry_run: Don't write to disk, just return result
        
        Returns:
            MergeResult with merged content and statistics
        """
        skill_name = skill_name or existing_path.parent.name
        output_path = output_path or existing_path
        
        # Check if existing doc exists
        if not existing_path.exists():
            # No existing doc, just use generated
            generated_content = generated_path.read_text(encoding='utf-8')
            
            if not dry_run:
                output_path.write_text(generated_content, encoding='utf-8')
            
            return MergeResult(
                skill_name=skill_name,
                success=True,
                merged_content=generated_content,
                sections_updated=len(self.section_markers),
                info=['No existing documentation - using generated content']
            )
        
        # Read both files
        existing_content = existing_path.read_text(encoding='utf-8')
        generated_content = generated_path.read_text(encoding='utf-8')
        
        # Parse into sections
        existing_sections = self._parse_sections(existing_content)
        generated_sections = self._parse_sections(generated_content)
        
        # Detect manual edit zones
        manual_zones = self._detect_manual_zones(existing_content)
        
        # Merge sections
        merged_sections, stats = self._merge_sections(
            existing_sections,
            generated_sections,
            manual_zones,
            preserve_all_manual
        )
        
        # Reconstruct document
        merged_content = self._reconstruct_document(merged_sections)
        
        # Write output if not dry run
        if not dry_run:
            # Create backup first
            if output_path.exists():
                backup_path = output_path.with_suffix('.md.bak')
                backup_path.write_text(existing_content, encoding='utf-8')
                logger.info(f"Created backup: {backup_path}")
            
            output_path.write_text(merged_content, encoding='utf-8')
        
        return MergeResult(
            skill_name=skill_name,
            success=True,
            merged_content=merged_content,
            sections_updated=stats['updated'],
            sections_preserved=stats['preserved'],
            manual_edits_preserved=stats['manual_zones'],
            updated_sections=stats['updated_list'],
            preserved_sections=stats['preserved_list'],
            manual_edit_zones=manual_zones,
            warnings=stats['warnings'],
            info=stats['info']
        )
    
    def _parse_sections(self, content: str) -> Dict[str, str]:
        """
        Parse documentation into sections.
        
        Returns:
            Dictionary mapping section header to full section content (including header)
        """
        sections = {}
        lines = content.split('\n')
        
        current_section = None
        current_content = []
        
        for line in lines:
            # Check if this is a section marker
            is_section = False
            for marker in self.section_markers:
                if line.strip().startswith(marker):
                    # Save previous section
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    
                    # Start new section
                    current_section = marker
                    current_content = [line]
                    is_section = True
                    break
            
            if not is_section:
                if current_section:
                    current_content.append(line)
                else:
                    # Before first section (title, metadata, etc.)
                    if '__HEADER__' not in sections:
                        sections['__HEADER__'] = line
                    else:
                        sections['__HEADER__'] += '\n' + line
        
        # Save last section
        if current_section:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _detect_manual_zones(self, content: str) -> List[Tuple[int, int]]:
        """
        Detect manual edit zones marked with special comments.
        
        Returns:
            List of (start_line, end_line) tuples for manual zones
        """
        zones = []
        lines = content.split('\n')
        
        in_zone = False
        zone_start = None
        
        for i, line in enumerate(lines):
            if MANUAL_EDIT_START in line:
                in_zone = True
                zone_start = i
            elif MANUAL_EDIT_END in line:
                if in_zone and zone_start is not None:
                    zones.append((zone_start, i))
                in_zone = False
                zone_start = None
        
        # Warn about unclosed zones
        if in_zone:
            logger.warning(f"Unclosed manual edit zone starting at line {zone_start}")
        
        return zones
    
    def _is_auto_generated(self, section_content: str) -> bool:
        """Check if a section is marked as auto-generated."""
        return AUTO_GENERATED_MARKER in section_content
    
    def _has_manual_edits(self, section_content: str, manual_zones: List[Tuple[int, int]]) -> bool:
        """Check if a section contains manual edit zones."""
        # Simple heuristic: check if content contains manual edit markers
        return MANUAL_EDIT_START in section_content
    
    def _merge_sections(
        self,
        existing_sections: Dict[str, str],
        generated_sections: Dict[str, str],
        manual_zones: List[Tuple[int, int]],
        preserve_all_manual: bool
    ) -> Tuple[Dict[str, str], Dict]:
        """
        Merge sections with smart preservation logic.
        
        Returns:
            Tuple of (merged_sections, statistics_dict)
        """
        merged = {}
        stats = {
            'updated': 0,
            'preserved': 0,
            'manual_zones': len(manual_zones),
            'updated_list': [],
            'preserved_list': [],
            'warnings': [],
            'info': []
        }
        
        # Always use generated header (title, version, author)
        if '__HEADER__' in generated_sections:
            merged['__HEADER__'] = generated_sections['__HEADER__']
        elif '__HEADER__' in existing_sections:
            merged['__HEADER__'] = existing_sections['__HEADER__']
        
        # Process each section
        all_sections = set(existing_sections.keys()) | set(generated_sections.keys())
        all_sections.discard('__HEADER__')  # Already handled
        
        for section in sorted(all_sections):
            existing = existing_sections.get(section, '')
            generated = generated_sections.get(section, '')
            
            # Decision logic
            if not existing:
                # New section from generated
                merged[section] = generated
                stats['updated'] += 1
                stats['updated_list'].append(section)
                stats['info'].append(f"Added new section: {section}")
            
            elif not generated:
                # Section removed in generated - preserve existing
                merged[section] = existing
                stats['preserved'] += 1
                stats['preserved_list'].append(section)
                stats['warnings'].append(f"Section {section} not in generated - preserved")
            
            elif self._is_auto_generated(existing):
                # Explicitly marked as auto-generated - replace with generated
                merged[section] = generated
                stats['updated'] += 1
                stats['updated_list'].append(section)
            
            elif self._has_manual_edits(existing, manual_zones):
                # Has manual edit markers - preserve existing
                merged[section] = existing
                stats['preserved'] += 1
                stats['preserved_list'].append(section)
                stats['info'].append(f"Preserved manual edits in: {section}")
            
            elif existing.strip() == generated.strip():
                # Identical - keep existing
                merged[section] = existing
                stats['preserved'] += 1
                stats['preserved_list'].append(section)
            
            elif preserve_all_manual:
                # Default: preserve existing (assume it might have manual edits)
                merged[section] = existing
                stats['preserved'] += 1
                stats['preserved_list'].append(section)
                stats['info'].append(f"Preserved existing content: {section}")
            
            else:
                # Replace with generated
                merged[section] = generated
                stats['updated'] += 1
                stats['updated_list'].append(section)
        
        return merged, stats
    
    def _reconstruct_document(self, sections: Dict[str, str]) -> str:
        """Reconstruct full document from sections."""
        parts = []
        
        # Header first
        if '__HEADER__' in sections:
            parts.append(sections['__HEADER__'])
        
        # Then sections in standard order
        for section in self.section_markers:
            if section in sections:
                parts.append(sections[section])
        
        # Then any remaining sections (custom sections)
        for section_name, content in sections.items():
            if section_name != '__HEADER__' and section_name not in self.section_markers:
                parts.append(content)
        
        return '\n\n'.join(parts)
    
    def print_result(self, result: MergeResult, verbose: bool = False):
        """
        Print a formatted merge result.
        
        Args:
            result: The merge result to print
            verbose: Include detailed section lists
        """
        print(f"\n{'='*60}")
        print(f"📝 Merge Result: {result.skill_name}")
        print(f"{'='*60}")
        
        status = '✅ SUCCESS' if result.success else '❌ FAILED'
        print(f"\n🔍 Status: {status}")
        
        print(f"\n📊 Statistics:")
        print(f"   Updated:   {result.sections_updated} sections")
        print(f"   Preserved: {result.sections_preserved} sections")
        print(f"   Manual edits preserved: {result.manual_edits_preserved} zones")
        
        if verbose:
            if result.updated_sections:
                print(f"\n✏️  Updated Sections:")
                for section in result.updated_sections:
                    print(f"   • {section}")
            
            if result.preserved_sections:
                print(f"\n🔒 Preserved Sections:")
                for section in result.preserved_sections:
                    print(f"   • {section}")
        
        if result.warnings:
            print(f"\n⚠️  Warnings:")
            for warning in result.warnings:
                print(f"   • {warning}")
        
        if result.info and verbose:
            print(f"\n💡 Info:")
            for info in result.info:
                print(f"   • {info}")
        
        print(f"\n{'='*60}\n")


def main():
    """CLI entry point for incremental updater."""
    import sys
    import argparse
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    parser = argparse.ArgumentParser(description='Incrementally update documentation')
    parser.add_argument('existing', help='Path to existing documentation')
    parser.add_argument('generated', help='Path to generated documentation')
    parser.add_argument('--output', '-o', help='Output path (default: overwrite existing)')
    parser.add_argument('--skill-name', help='Name of the skill')
    parser.add_argument('--replace-all', action='store_true', 
                       help='Replace all sections (don\'t preserve manual)')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Don\'t write to disk')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Verbose output')
    
    args = parser.parse_args()
    
    updater = IncrementalUpdater()
    
    existing_path = Path(args.existing)
    generated_path = Path(args.generated)
    output_path = Path(args.output) if args.output else None
    
    if not generated_path.exists():
        print(f"❌ Error: Generated file not found: {generated_path}")
        sys.exit(1)
    
    # Perform merge
    result = updater.merge(
        existing_path,
        generated_path,
        output_path,
        args.skill_name,
        preserve_all_manual=not args.replace_all,
        dry_run=args.dry_run
    )
    
    # Print result
    updater.print_result(result, verbose=args.verbose)
    
    if args.dry_run:
        print("💾 Dry run - no files were modified")
    elif result.success:
        output_file = output_path or existing_path
        print(f"💾 Merged documentation written to: {output_file}")
    
    sys.exit(0 if result.success else 1)


if __name__ == '__main__':
    main()

