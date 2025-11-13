#!/usr/bin/env python3
"""
File Mapper - Maps source files to relevant test files

Uses pattern matching, configuration rules, and heuristics to determine
which tests should run for a given set of changed files.
"""

import json
from pathlib import Path
from typing import List, Dict, Set, Optional, Tuple
from fnmatch import fnmatch
from dataclasses import dataclass


@dataclass
class TestMapping:
    """Represents a mapping from source to test files"""
    test_files: List[str]
    confidence: str  # 'high', 'medium', 'low'
    reason: str
    source_file: str


class FileMapper:
    """Maps source files to their relevant test files"""
    
    def __init__(self, config_path: Optional[Path] = None, project_root: Optional[Path] = None):
        """Initialize mapper with configuration
        
        Args:
            config_path: Path to test-mapping.json config file
            project_root: Root directory of project
        """
        self.project_root = project_root or Path.cwd()
        self.config_path = config_path or self.project_root / '.claude/agents/test-selector/resources/test-mapping.json'
        self.config = self._load_config()
    
    def _load_config(self) -> dict:
        """Load test mapping configuration"""
        default_config = {
            "patterns": [
                {
                    "source": "scripts/**/*.js",
                    "tests": ["tests/commands/**/*.test.js"],
                    "confidence": "high"
                },
                {
                    "source": "lib/**/*.js",
                    "tests": ["tests/**/*.test.js"],
                    "confidence": "medium"
                },
                {
                    "source": ".claude/hooks/**/*.js",
                    "tests": ["tests/hooks/**/*.test.js"],
                    "confidence": "high"
                },
                {
                    "source": ".claude/skills/**/*.py",
                    "tests": [".claude/skills/**/tests/**/*.py"],
                    "confidence": "high"
                }
            ],
            "critical_tests": [
                "tests/integration/integration.test.js"
            ],
            "always_run": [
                "tests/health-*.test.js"
            ],
            "test_directories": [
                "tests/",
                ".claude/skills/*/tests/"
            ]
        }
        
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r') as f:
                    loaded_config = json.load(f)
                    # Merge with defaults
                    return {**default_config, **loaded_config}
            except (json.JSONDecodeError, OSError) as e:
                print(f"Warning: Failed to load config from {self.config_path}: {e}")
                print("Using default configuration")
        
        return default_config
    
    def map_files(self, changed_files: List[str]) -> List[TestMapping]:
        """Map changed files to test files
        
        Args:
            changed_files: List of changed source file paths
            
        Returns:
            List of TestMapping objects with test files and confidence
        """
        mappings: List[TestMapping] = []
        seen_tests: Set[str] = set()
        
        for source_file in changed_files:
            # Skip if already a test file
            if self._is_test_file(source_file):
                if source_file not in seen_tests:
                    mappings.append(TestMapping(
                        test_files=[source_file],
                        confidence='high',
                        reason='direct (test file modified)',
                        source_file=source_file
                    ))
                    seen_tests.add(source_file)
                continue
            
            # Try pattern-based mapping
            pattern_mapping = self._map_by_pattern(source_file)
            if pattern_mapping:
                for test_file in pattern_mapping.test_files:
                    if test_file not in seen_tests:
                        mappings.append(pattern_mapping)
                        seen_tests.add(test_file)
            
            # Try direct mapping (source.js -> source.test.js)
            direct_mapping = self._map_direct(source_file)
            if direct_mapping:
                for test_file in direct_mapping.test_files:
                    if test_file not in seen_tests:
                        mappings.append(direct_mapping)
                        seen_tests.add(test_file)
            
            # Try dependency-based mapping
            dep_mapping = self._map_by_dependency(source_file)
            if dep_mapping:
                for test_file in dep_mapping.test_files:
                    if test_file not in seen_tests:
                        mappings.append(dep_mapping)
                        seen_tests.add(test_file)
        
        return mappings
    
    def get_critical_tests(self) -> List[str]:
        """Get list of critical tests that should always run"""
        critical = self.config.get('critical_tests', [])
        always_run = self.config.get('always_run', [])
        
        result: Set[str] = set()
        
        # Expand glob patterns
        for pattern in critical + always_run:
            if '*' in pattern:
                result.update(self._expand_glob(pattern))
            else:
                filepath = self.project_root / pattern
                if filepath.exists():
                    result.add(str(filepath))
        
        return sorted(result)
    
    def _is_test_file(self, filepath: str) -> bool:
        """Check if file is a test file"""
        path = Path(filepath)
        
        # Check common test patterns
        test_patterns = [
            '*.test.js',
            '*.test.ts',
            '*.spec.js',
            '*.spec.ts',
            'test_*.py',
            '*_test.py'
        ]
        
        for pattern in test_patterns:
            if fnmatch(path.name, pattern):
                return True
        
        # Check if in test directory
        return 'test' in path.parts or 'tests' in path.parts
    
    def _map_by_pattern(self, source_file: str) -> Optional[TestMapping]:
        """Map using configuration patterns"""
        rel_path = self._get_relative_path(source_file)
        
        for pattern_rule in self.config.get('patterns', []):
            source_pattern = pattern_rule['source']
            
            if self._matches_pattern(rel_path, source_pattern):
                test_patterns = pattern_rule['tests']
                confidence = pattern_rule.get('confidence', 'medium')
                
                # Find matching test files
                test_files = []
                for test_pattern in test_patterns:
                    test_files.extend(self._expand_glob(test_pattern))
                
                if test_files:
                    return TestMapping(
                        test_files=test_files,
                        confidence=confidence,
                        reason=f'pattern match ({source_pattern})',
                        source_file=source_file
                    )
        
        return None
    
    def _map_direct(self, source_file: str) -> Optional[TestMapping]:
        """Try direct mapping (source.js -> source.test.js)"""
        path = Path(source_file)
        
        # Generate possible test file names
        stem = path.stem
        parent = path.parent
        
        possible_tests = [
            parent / f"{stem}.test{path.suffix}",
            parent / f"{stem}.spec{path.suffix}",
            self.project_root / 'tests' / path.relative_to(self.project_root).parent / f"{stem}.test{path.suffix}",
        ]
        
        # Check if any exist
        existing_tests = [str(t) for t in possible_tests if t.exists()]
        
        if existing_tests:
            return TestMapping(
                test_files=existing_tests,
                confidence='high',
                reason='direct naming convention',
                source_file=source_file
            )
        
        return None
    
    def _map_by_dependency(self, source_file: str) -> Optional[TestMapping]:
        """Map based on module dependencies (simple heuristic)"""
        # For now, use a simple heuristic:
        # If it's in a shared/common directory, it might affect multiple tests
        
        rel_path = self._get_relative_path(source_file)
        
        # Check if in common/shared locations
        shared_indicators = ['lib/', 'utils/', 'common/', 'shared/', 'core/']
        
        for indicator in shared_indicators:
            if indicator in rel_path:
                # This is a shared module - find related tests
                test_files = self._find_all_tests()
                
                if test_files:
                    return TestMapping(
                        test_files=test_files[:10],  # Limit to avoid overwhelming
                        confidence='low',
                        reason=f'shared module dependency ({indicator})',
                        source_file=source_file
                    )
        
        return None
    
    def _get_relative_path(self, filepath: str) -> str:
        """Get path relative to project root"""
        try:
            return str(Path(filepath).relative_to(self.project_root))
        except ValueError:
            return filepath
    
    def _matches_pattern(self, filepath: str, pattern: str) -> bool:
        """Check if filepath matches glob pattern"""
        # Handle both absolute and relative patterns
        if fnmatch(filepath, pattern):
            return True
        
        # Try matching just the filename
        if fnmatch(Path(filepath).name, pattern):
            return True
        
        # Try Unix-style path matching
        if '**' in pattern:
            # Convert ** to regex-like matching
            pattern_parts = pattern.split('**/')
            if len(pattern_parts) == 2:
                if filepath.endswith(pattern_parts[1].replace('*', '')):
                    return True
        
        return False
    
    def _expand_glob(self, pattern: str) -> List[str]:
        """Expand glob pattern to list of files"""
        if not pattern:
            return []
        
        # Convert pattern to Path and expand
        if pattern.startswith('/'):
            search_root = Path(pattern).parent
            pattern = Path(pattern).name
        else:
            search_root = self.project_root
        
        # Handle ** patterns
        if '**' in pattern:
            parts = pattern.split('**/')
            if len(parts) == 2:
                prefix = parts[0].rstrip('/')
                suffix = parts[1]
                
                search_path = search_root / prefix if prefix else search_root
                return [str(p) for p in search_path.rglob(suffix) if p.is_file()]
        
        # Simple glob
        return [str(p) for p in search_root.glob(pattern) if p.is_file()]
    
    def _find_all_tests(self) -> List[str]:
        """Find all test files in project"""
        test_files: Set[str] = set()
        
        for test_dir_pattern in self.config.get('test_directories', ['tests/']):
            test_files.update(self._expand_glob(f"{test_dir_pattern}**/*.test.js"))
            test_files.update(self._expand_glob(f"{test_dir_pattern}**/*.test.ts"))
            test_files.update(self._expand_glob(f"{test_dir_pattern}**/test_*.py"))
        
        return sorted(test_files)


def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Map source files to test files')
    parser.add_argument('files', nargs='+', help='Source files to map')
    parser.add_argument('--config', help='Path to test-mapping.json')
    parser.add_argument('--show-critical', action='store_true',
                       help='Show critical tests')
    
    args = parser.parse_args()
    
    mapper = FileMapper(
        config_path=Path(args.config) if args.config else None
    )
    
    if args.show_critical:
        print("\n🎯 Critical Tests (always run):")
        for test in mapper.get_critical_tests():
            print(f"  • {test}")
        print()
    
    mappings = mapper.map_files(args.files)
    
    print(f"\n📋 Test Mappings for {len(args.files)} file(s):\n")
    
    for mapping in mappings:
        print(f"Source: {mapping.source_file}")
        print(f"Confidence: {mapping.confidence}")
        print(f"Reason: {mapping.reason}")
        print(f"Tests ({len(mapping.test_files)}):")
        for test in mapping.test_files:
            print(f"  • {test}")
        print()


if __name__ == '__main__':
    main()

