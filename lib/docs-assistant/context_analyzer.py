"""
Context Analyzer

Detects current development context from various sources.
"""

import logging
from typing import List, Optional
from pathlib import Path
import subprocess
import os

from .models import Context, ContextType

logger = logging.getLogger(__name__)


class ContextAnalyzer:
    """
    Multi-source context detection.
    
    Detects:
    - Current file and language
    - Active task (from Taskmaster)
    - Recent errors (from logs)
    - Git branch
    - Recent commands (from shell history)
    """
    
    def __init__(self):
        """Initialize context analyzer."""
        pass
    
    def analyze(self) -> List[Context]:
        """
        Analyze current development context.
        
        Returns:
            List of detected contexts
        """
        contexts = []
        
        # Detect current file
        file_context = self._detect_current_file()
        if file_context:
            contexts.append(file_context)
        
        # Detect git branch
        git_context = self._detect_git_branch()
        if git_context:
            contexts.append(git_context)
        
        # Detect recent commands
        command_contexts = self._detect_recent_commands()
        contexts.extend(command_contexts)
        
        logger.debug(f"Detected {len(contexts)} contexts")
        
        return contexts
    
    def _detect_current_file(self) -> Optional[Context]:
        """Detect current file from environment."""
        # Try to get from environment variable (set by editor/IDE)
        current_file = os.environ.get('CURRENT_FILE')
        
        if current_file and Path(current_file).exists():
            file_path = Path(current_file)
            
            return Context(
                type=ContextType.FILE,
                value=str(file_path),
                metadata={
                    'extension': file_path.suffix,
                    'name': file_path.name,
                    'language': self._detect_language(file_path)
                }
            )
        
        return None
    
    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension."""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'react',
            '.tsx': 'react-typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.sh': 'shell',
            '.sql': 'sql',
            '.md': 'markdown'
        }
        
        return ext_map.get(file_path.suffix.lower(), 'unknown')
    
    def _detect_git_branch(self) -> Optional[Context]:
        """Detect current git branch."""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                capture_output=True,
                text=True,
                timeout=2
            )
            
            if result.returncode == 0:
                branch = result.stdout.strip()
                return Context(
                    type=ContextType.GIT_BRANCH,
                    value=branch,
                    metadata={'vcs': 'git'}
                )
        
        except Exception as e:
            logger.debug(f"Could not detect git branch: {e}")
        
        return None
    
    def _detect_recent_commands(self, limit: int = 5) -> List[Context]:
        """Detect recent shell commands."""
        contexts = []
        
        try:
            # Try to read from shell history
            history_file = Path.home() / '.bash_history'
            if not history_file.exists():
                history_file = Path.home() / '.zsh_history'
            
            if history_file.exists():
                with open(history_file, 'r', errors='ignore') as f:
                    lines = f.readlines()
                    recent = lines[-limit:]
                    
                    for line in recent:
                        cmd = line.strip()
                        if cmd and not cmd.startswith('#'):
                            contexts.append(Context(
                                type=ContextType.COMMAND,
                                value=cmd,
                                metadata={'source': 'shell_history'}
                            ))
        
        except Exception as e:
            logger.debug(f"Could not read shell history: {e}")
        
        return contexts
    
    def detect_error(self, error_text: str) -> Context:
        """
        Create error context from error text.
        
        Args:
            error_text: Error message or stack trace
        
        Returns:
            Error context
        """
        return Context(
            type=ContextType.ERROR,
            value=error_text,
            metadata={'detected': True}
        )
    
    def detect_task(self, task_id: str, task_title: str) -> Context:
        """
        Create task context.
        
        Args:
            task_id: Task ID from Taskmaster
            task_title: Task title
        
        Returns:
            Task context
        """
        return Context(
            type=ContextType.TASK,
            value=task_title,
            metadata={'task_id': task_id}
        )

