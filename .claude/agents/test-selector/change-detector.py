#!/usr/bin/env python3
"""
Change Detector - Identifies modified files for test selection

Supports multiple detection strategies:
1. Git-based (staged, unstaged, or committed changes)
2. Timestamp-based (file modification times)
3. Explicit file list (user-provided)
"""

import os
import subprocess
from pathlib import Path
from typing import List, Set, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class ChangeDetectionResult:
    """Result of change detection operation"""
    files: List[str]
    strategy: str
    timestamp: datetime
    confidence: float
    metadata: dict


class ChangeDetector:
    """Detects file changes using various strategies"""
    
    def __init__(self, project_root: Optional[Path] = None):
        """Initialize detector with project root
        
        Args:
            project_root: Root directory of project (default: current dir)
        """
        self.project_root = project_root or Path.cwd()
        self.strategies = {
            'git-diff': self._detect_git_diff,
            'git-staged': self._detect_git_staged,
            'git-commits': self._detect_git_commits,
            'timestamp': self._detect_by_timestamp,
            'explicit': self._detect_explicit
        }
    
    def detect(
        self,
        strategy: str = 'auto',
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True,
        file_patterns: Optional[List[str]] = None
    ) -> ChangeDetectionResult:
        """Detect changed files using specified strategy
        
        Args:
            strategy: Detection strategy ('auto', 'git-diff', 'git-staged', 
                     'git-commits', 'timestamp', 'explicit')
            files: Explicit file list (for 'explicit' strategy)
            since_minutes: Look back window for timestamp/commit strategies
            include_staged: Include staged files in git detection
            file_patterns: Filter results by glob patterns (e.g., ['*.js', '*.py'])
            
        Returns:
            ChangeDetectionResult with detected files and metadata
        """
        # Auto-select strategy
        if strategy == 'auto':
            strategy = self._select_strategy(files)
        
        # Execute detection strategy
        if strategy not in self.strategies:
            raise ValueError(f"Unknown strategy: {strategy}")
        
        detector_func = self.strategies[strategy]
        detected_files = detector_func(
            files=files,
            since_minutes=since_minutes,
            include_staged=include_staged
        )
        
        # Filter by patterns if provided
        if file_patterns:
            detected_files = self._filter_by_patterns(detected_files, file_patterns)
        
        # Calculate confidence based on strategy
        confidence = self._calculate_confidence(strategy, len(detected_files))
        
        return ChangeDetectionResult(
            files=sorted(detected_files),
            strategy=strategy,
            timestamp=datetime.now(),
            confidence=confidence,
            metadata={
                'file_count': len(detected_files),
                'project_root': str(self.project_root),
                'patterns_applied': file_patterns or []
            }
        )
    
    def _select_strategy(self, explicit_files: Optional[List[str]]) -> str:
        """Auto-select best detection strategy"""
        if explicit_files:
            return 'explicit'
        elif self._is_git_repo():
            return 'git-diff'
        else:
            return 'timestamp'
    
    def _is_git_repo(self) -> bool:
        """Check if current directory is a git repository"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--git-dir'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=2
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False
    
    def _detect_git_diff(
        self,
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True
    ) -> List[str]:
        """Detect changes using git diff (unstaged + optionally staged)"""
        changed_files: Set[str] = set()
        
        try:
            # Get unstaged changes
            result = subprocess.run(
                ['git', 'diff', '--name-only'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                changed_files.update(result.stdout.strip().split('\n'))
            
            # Get staged changes if requested
            if include_staged:
                result = subprocess.run(
                    ['git', 'diff', '--cached', '--name-only'],
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    changed_files.update(result.stdout.strip().split('\n'))
            
            # Remove empty strings
            changed_files.discard('')
            
            # Convert to absolute paths
            return [
                str(self.project_root / f)
                for f in changed_files
                if f and (self.project_root / f).exists()
            ]
            
        except subprocess.SubprocessError as e:
            print(f"Warning: Git detection failed: {e}")
            return []
    
    def _detect_git_staged(
        self,
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True
    ) -> List[str]:
        """Detect only staged changes"""
        try:
            result = subprocess.run(
                ['git', 'diff', '--cached', '--name-only'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                changed_files = [
                    f for f in result.stdout.strip().split('\n')
                    if f
                ]
                return [
                    str(self.project_root / f)
                    for f in changed_files
                    if (self.project_root / f).exists()
                ]
            
            return []
            
        except subprocess.SubprocessError as e:
            print(f"Warning: Git staged detection failed: {e}")
            return []
    
    def _detect_git_commits(
        self,
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True
    ) -> List[str]:
        """Detect changes in recent commits"""
        try:
            # Calculate time boundary
            since_time = f"{since_minutes} minutes ago"
            
            result = subprocess.run(
                ['git', 'log', '--since', since_time, '--name-only', '--pretty=format:'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                changed_files = [
                    f for f in result.stdout.strip().split('\n')
                    if f
                ]
                # Remove duplicates and convert to absolute paths
                unique_files = list(set(changed_files))
                return [
                    str(self.project_root / f)
                    for f in unique_files
                    if (self.project_root / f).exists()
                ]
            
            return []
            
        except subprocess.SubprocessError as e:
            print(f"Warning: Git commit detection failed: {e}")
            return []
    
    def _detect_by_timestamp(
        self,
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True
    ) -> List[str]:
        """Detect changes by file modification timestamps"""
        cutoff_time = datetime.now() - timedelta(minutes=since_minutes)
        changed_files: List[str] = []
        
        # Search for recently modified files
        for root, _, filenames in os.walk(self.project_root):
            # Skip hidden directories and common ignores
            if any(part.startswith('.') for part in Path(root).parts):
                continue
            if 'node_modules' in root or '__pycache__' in root:
                continue
            
            for filename in filenames:
                # Skip hidden files and non-code files
                if filename.startswith('.'):
                    continue
                if not any(filename.endswith(ext) for ext in ['.js', '.py', '.ts', '.jsx', '.tsx']):
                    continue
                
                filepath = Path(root) / filename
                try:
                    mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
                    if mtime > cutoff_time:
                        changed_files.append(str(filepath))
                except OSError:
                    continue
        
        return changed_files
    
    def _detect_explicit(
        self,
        files: Optional[List[str]] = None,
        since_minutes: int = 60,
        include_staged: bool = True
    ) -> List[str]:
        """Use explicitly provided file list"""
        if not files:
            return []
        
        # Convert to absolute paths and verify existence
        result = []
        for f in files:
            filepath = Path(f)
            if not filepath.is_absolute():
                filepath = self.project_root / filepath
            
            if filepath.exists():
                result.append(str(filepath))
            else:
                print(f"Warning: File not found: {f}")
        
        return result
    
    def _filter_by_patterns(self, files: List[str], patterns: List[str]) -> List[str]:
        """Filter file list by glob patterns"""
        from fnmatch import fnmatch
        
        filtered = []
        for filepath in files:
            for pattern in patterns:
                if fnmatch(filepath, pattern) or fnmatch(Path(filepath).name, pattern):
                    filtered.append(filepath)
                    break
        
        return filtered
    
    def _calculate_confidence(self, strategy: str, file_count: int) -> float:
        """Calculate confidence score for detection strategy"""
        # Base confidence by strategy
        base_confidence = {
            'git-diff': 0.95,
            'git-staged': 0.98,
            'git-commits': 0.90,
            'timestamp': 0.70,
            'explicit': 1.0
        }
        
        confidence = base_confidence.get(strategy, 0.5)
        
        # Adjust based on file count
        if file_count == 0:
            confidence *= 0.5  # Low confidence if no files detected
        elif file_count > 50:
            confidence *= 0.8  # Lower confidence with many changes
        
        return confidence


def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Detect changed files')
    parser.add_argument('--strategy', default='auto',
                       help='Detection strategy (auto, git-diff, timestamp, etc.)')
    parser.add_argument('--files', nargs='+', help='Explicit file list')
    parser.add_argument('--since', type=int, default=60,
                       help='Look back minutes (for timestamp/commits)')
    parser.add_argument('--patterns', nargs='+',
                       help='Filter by patterns (e.g., *.js *.py)')
    
    args = parser.parse_args()
    
    detector = ChangeDetector()
    result = detector.detect(
        strategy=args.strategy,
        files=args.files,
        since_minutes=args.since,
        file_patterns=args.patterns
    )
    
    print(f"\n📋 Change Detection Results")
    print(f"Strategy: {result.strategy}")
    print(f"Confidence: {result.confidence:.0%}")
    print(f"Files detected: {len(result.files)}\n")
    
    for f in result.files:
        print(f"  • {f}")


if __name__ == '__main__':
    main()

