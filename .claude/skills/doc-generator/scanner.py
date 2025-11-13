"""
Skill Directory Scanner Module

This module provides functionality to recursively scan the `.claude/skills/` directory
and identify all skill subdirectories for documentation generation.

Author: Momentum Squared
Date: November 13, 2025
Version: 1.0.0
"""

from pathlib import Path
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class SkillDirectoryScanner:
    """
    Scanner for identifying skill directories within the .claude/skills/ structure.
    
    Handles symbolic links, hidden directories, and provides filtering capabilities.
    """
    
    def __init__(self, base_dir: Optional[Path] = None):
        """
        Initialize the scanner with a base directory.
        
        Args:
            base_dir: Root directory to scan. Defaults to .claude/skills/ relative to cwd.
        """
        if base_dir is None:
            self.base_dir = Path.cwd() / '.claude' / 'skills'
        else:
            self.base_dir = Path(base_dir)
        
        if not self.base_dir.exists():
            logger.warning(f"Base directory does not exist: {self.base_dir}")
    
    def scan(
        self,
        include_hidden: bool = False,
        follow_symlinks: bool = False,
        exclude_patterns: Optional[List[str]] = None
    ) -> List[Path]:
        """
        Scan for skill directories.
        
        Args:
            include_hidden: If True, include hidden directories (starting with '.')
            follow_symlinks: If True, follow symbolic links
            exclude_patterns: List of directory name patterns to exclude
        
        Returns:
            List of Path objects representing skill directories
        """
        if not self.base_dir.exists():
            logger.error(f"Cannot scan non-existent directory: {self.base_dir}")
            return []
        
        exclude_patterns = exclude_patterns or []
        skill_dirs = []
        
        try:
            for item in self.base_dir.iterdir():
                # Skip if not a directory
                if not item.is_dir():
                    continue
                
                # Handle symbolic links
                if item.is_symlink() and not follow_symlinks:
                    logger.debug(f"Skipping symlink: {item}")
                    continue
                
                # Skip hidden directories unless explicitly included
                if item.name.startswith('.') and not include_hidden:
                    logger.debug(f"Skipping hidden directory: {item}")
                    continue
                
                # Skip excluded patterns
                if any(pattern in item.name for pattern in exclude_patterns):
                    logger.debug(f"Skipping excluded directory: {item}")
                    continue
                
                # Check if directory contains skill indicators
                if self._is_skill_directory(item):
                    skill_dirs.append(item)
                    logger.info(f"Found skill directory: {item}")
                else:
                    logger.debug(f"Skipping non-skill directory: {item}")
        
        except PermissionError as e:
            logger.error(f"Permission denied scanning {self.base_dir}: {e}")
        except Exception as e:
            logger.error(f"Error scanning {self.base_dir}: {e}")
        
        return sorted(skill_dirs)
    
    def _is_skill_directory(self, path: Path) -> bool:
        """
        Determine if a directory is a skill directory.
        
        A directory is considered a skill if it contains:
        - skill.md or skill.json file, OR
        - A src/ or resources/ subdirectory, OR
        - Python files in the root
        
        Args:
            path: Directory path to check
        
        Returns:
            True if the directory appears to be a skill
        """
        # Check for skill definition files
        if (path / 'skill.md').exists() or (path / 'skill.json').exists():
            return True
        
        # Check for common skill subdirectories
        if (path / 'src').exists() or (path / 'resources').exists():
            return True
        
        # Check for Python files in root
        if list(path.glob('*.py')):
            return True
        
        return False
    
    def get_skill_info(self, skill_path: Path) -> dict:
        """
        Extract basic information about a skill directory.
        
        Args:
            skill_path: Path to the skill directory
        
        Returns:
            Dictionary with skill name, path, and indicators
        """
        return {
            'name': skill_path.name,
            'path': skill_path,
            'absolute_path': skill_path.resolve(),
            'has_skill_md': (skill_path / 'skill.md').exists(),
            'has_skill_json': (skill_path / 'skill.json').exists(),
            'has_src': (skill_path / 'src').is_dir() if (skill_path / 'src').exists() else False,
            'has_resources': (skill_path / 'resources').is_dir() if (skill_path / 'resources').exists() else False,
            'has_tests': (skill_path / 'tests').is_dir() if (skill_path / 'tests').exists() else False,
        }
    
    def scan_with_info(
        self,
        include_hidden: bool = False,
        follow_symlinks: bool = False,
        exclude_patterns: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Scan for skills and return detailed information.
        
        Args:
            include_hidden: If True, include hidden directories
            follow_symlinks: If True, follow symbolic links
            exclude_patterns: List of directory name patterns to exclude
        
        Returns:
            List of dictionaries with skill information
        """
        skill_paths = self.scan(
            include_hidden=include_hidden,
            follow_symlinks=follow_symlinks,
            exclude_patterns=exclude_patterns
        )
        
        return [self.get_skill_info(path) for path in skill_paths]


def main():
    """CLI entry point for testing the scanner."""
    import sys
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    # Parse arguments
    base_dir = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Create scanner and scan
    scanner = SkillDirectoryScanner(base_dir)
    skills = scanner.scan_with_info()
    
    # Display results
    print(f"\n✅ Found {len(skills)} skill(s):\n")
    for skill in skills:
        print(f"📦 {skill['name']}")
        print(f"   Path: {skill['path']}")
        print(f"   Has skill.md: {'✓' if skill['has_skill_md'] else '✗'}")
        print(f"   Has skill.json: {'✓' if skill['has_skill_json'] else '✗'}")
        print(f"   Has src/: {'✓' if skill['has_src'] else '✗'}")
        print(f"   Has resources/: {'✓' if skill['has_resources'] else '✗'}")
        print()


if __name__ == '__main__':
    main()

