"""
Command History Tracking

Logs expanded commands for auditing and reference.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class HistoryEntry:
    """Single command history entry."""
    timestamp: str
    template_name: str
    workflow: str
    command: str
    variables: Dict[str, Any]
    executed: bool
    exit_code: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class CommandHistory:
    """
    Manages command execution history.
    
    Features:
    - Persistent JSON storage
    - Timestamp tracking
    - Execution status
    - Search and filter
    """
    
    def __init__(self, history_file: Optional[Path] = None):
        """
        Initialize command history.
        
        Args:
            history_file: Path to history file (default: ~/.tmx-history.json)
        """
        if history_file is None:
            self.history_file = Path.home() / '.tmx-history.json'
        else:
            self.history_file = Path(history_file)
        
        self.entries: List[HistoryEntry] = []
        self._load()
    
    def _load(self):
        """Load history from file."""
        if not self.history_file.exists():
            return
        
        try:
            with open(self.history_file, 'r') as f:
                data = json.load(f)
                self.entries = [
                    HistoryEntry(**entry) for entry in data.get('history', [])
                ]
        except Exception:
            # If loading fails, start fresh
            self.entries = []
    
    def _save(self):
        """Save history to file."""
        # Ensure parent directory exists
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        
        data = {
            'version': '1.0',
            'history': [entry.to_dict() for entry in self.entries]
        }
        
        with open(self.history_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add(
        self,
        template_name: str,
        workflow: str,
        command: str,
        variables: Dict[str, Any],
        executed: bool = False,
        exit_code: Optional[int] = None
    ):
        """
        Add a command to history.
        
        Args:
            template_name: Name of template used
            workflow: Workflow category
            command: Expanded command
            variables: Variables used
            executed: Whether command was executed
            exit_code: Exit code if executed
        """
        entry = HistoryEntry(
            timestamp=datetime.now().isoformat(),
            template_name=template_name,
            workflow=workflow,
            command=command,
            variables=variables,
            executed=executed,
            exit_code=exit_code
        )
        
        self.entries.append(entry)
        self._save()
    
    def get_recent(self, limit: int = 10) -> List[HistoryEntry]:
        """
        Get recent history entries.
        
        Args:
            limit: Maximum number of entries to return
        
        Returns:
            List of recent entries (most recent first)
        """
        return list(reversed(self.entries[-limit:]))
    
    def search(
        self,
        template_name: Optional[str] = None,
        workflow: Optional[str] = None,
        executed_only: bool = False
    ) -> List[HistoryEntry]:
        """
        Search history with filters.
        
        Args:
            template_name: Filter by template name
            workflow: Filter by workflow
            executed_only: Only return executed commands
        
        Returns:
            Filtered list of entries
        """
        results = self.entries
        
        if template_name:
            results = [e for e in results if e.template_name == template_name]
        
        if workflow:
            results = [e for e in results if e.workflow == workflow]
        
        if executed_only:
            results = [e for e in results if e.executed]
        
        return results
    
    def clear(self):
        """Clear all history."""
        self.entries = []
        self._save()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get history statistics.
        
        Returns:
            Dictionary of statistics
        """
        total = len(self.entries)
        executed = sum(1 for e in self.entries if e.executed)
        
        # Count by workflow
        workflows = {}
        for entry in self.entries:
            workflows[entry.workflow] = workflows.get(entry.workflow, 0) + 1
        
        # Count by template
        templates = {}
        for entry in self.entries:
            templates[entry.template_name] = templates.get(entry.template_name, 0) + 1
        
        return {
            'total_commands': total,
            'executed_commands': executed,
            'by_workflow': workflows,
            'by_template': templates,
            'most_used_template': max(templates.items(), key=lambda x: x[1])[0] if templates else None
        }

