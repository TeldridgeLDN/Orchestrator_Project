"""
Safety Features

Validates commands against dangerous patterns and denylist.
"""

import re
from typing import List, Tuple, Optional


# Dangerous command patterns (regex)
DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/',  # rm -rf / (root deletion)
    r'dd\s+if=/dev/.*\s+of=/dev/sd',  # dd to disk
    r'mkfs\..*\s+/dev/',  # filesystem formatting
    r':\(\)\{\s*:\|:&\s*\};:',  # fork bomb
    r'chmod\s+-R\s+777',  # chmod 777 everything
    r'curl.*\|\s*bash',  # Pipe curl to bash
    r'wget.*\|\s*sh',  # Pipe wget to shell
    r'eval\s+\$\(',  # eval with command substitution
    r'shutdown\s+',  # System shutdown
    r'reboot\s*',  # System reboot
    r'kill\s+-9\s+1',  # Kill init process
]

# Dangerous keywords (require confirmation)
DANGEROUS_KEYWORDS = [
    'DROP DATABASE',
    'DROP TABLE',
    'TRUNCATE',
    '--force',
    '--no-verify',
    'rm -rf',
    'git reset --hard',
    'git push --force',
    'sudo rm',
    'sudo dd',
]


class CommandSafety:
    """
    Validates commands for safety.
    
    Features:
    - Dangerous pattern detection
    - Keyword-based warnings
    - Customizable denylist
    - Confirmation requirements
    """
    
    def __init__(self, custom_patterns: Optional[List[str]] = None):
        """
        Initialize safety checker.
        
        Args:
            custom_patterns: Additional dangerous patterns to check
        """
        self.patterns = DANGEROUS_PATTERNS.copy()
        if custom_patterns:
            self.patterns.extend(custom_patterns)
        
        self.keywords = DANGEROUS_KEYWORDS.copy()
    
    def check_command(self, command: str) -> Tuple[bool, List[str], List[str]]:
        """
        Check if command is safe to execute.
        
        Args:
            command: Command string to check
        
        Returns:
            Tuple of (is_safe, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Check against dangerous patterns
        for pattern in self.patterns:
            if re.search(pattern, command, re.IGNORECASE):
                errors.append(
                    f"Command matches dangerous pattern: {pattern}"
                )
        
        # Check for dangerous keywords
        for keyword in self.keywords:
            if keyword in command:
                warnings.append(
                    f"Command contains potentially dangerous keyword: {keyword}"
                )
        
        # Additional checks
        
        # Check for sudo without specific command
        if re.search(r'sudo\s+\$', command):
            warnings.append("Using sudo with variable expansion - ensure variables are trusted")
        
        # Check for wildcard deletions
        if re.search(r'rm\s+.*\*', command):
            warnings.append("Using wildcard with rm - double-check the path")
        
        # Check for force flags with critical operations
        if '--force' in command and any(op in command for op in ['git push', 'npm publish', 'docker rmi']):
            warnings.append("Using --force with critical operation")
        
        is_safe = len(errors) == 0
        
        return is_safe, errors, warnings
    
    def add_pattern(self, pattern: str):
        """Add a custom dangerous pattern."""
        self.patterns.append(pattern)
    
    def add_keyword(self, keyword: str):
        """Add a custom dangerous keyword."""
        self.keywords.append(keyword)
    
    def is_dangerous_operation(self, command: str) -> bool:
        """
        Quick check if command is considered dangerous.
        
        Args:
            command: Command to check
        
        Returns:
            True if dangerous
        """
        is_safe, _, _ = self.check_command(command)
        return not is_safe


# ===== Convenience functions =====

def check_command_safety(command: str) -> Tuple[bool, List[str], List[str]]:
    """
    Check command safety (convenience function).
    
    Args:
        command: Command to check
    
    Returns:
        Tuple of (is_safe, errors, warnings)
    """
    checker = CommandSafety()
    return checker.check_command(command)

