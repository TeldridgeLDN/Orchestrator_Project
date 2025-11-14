"""Console alert channel."""

import logging
from typing import Optional

try:
    from rich.console import Console
    from rich.panel import Panel
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from ..models import Alert, AlertSeverity

logger = logging.getLogger(__name__)


class ConsoleChannel:
    """Console output channel using rich."""
    
    def __init__(self, use_rich: bool = True):
        """Initialize console channel."""
        self.use_rich = use_rich and RICH_AVAILABLE
        self.console = Console() if self.use_rich else None
    
    def send(self, alert: Alert):
        """Send alert to console."""
        if self.use_rich and self.console:
            self._send_rich(alert)
        else:
            self._send_plain(alert)
    
    def _send_rich(self, alert: Alert):
        """Send using rich formatting."""
        # Color and icon by severity
        color_map = {
            AlertSeverity.DEBUG: "dim",
            AlertSeverity.INFO: "blue",
            AlertSeverity.WARNING: "yellow",
            AlertSeverity.ERROR: "red",
            AlertSeverity.CRITICAL: "red bold"
        }
        
        icon_map = {
            AlertSeverity.DEBUG: "🔍",
            AlertSeverity.INFO: "ℹ️",
            AlertSeverity.WARNING: "⚠️",
            AlertSeverity.ERROR: "❌",
            AlertSeverity.CRITICAL: "🚨"
        }
        
        color = color_map.get(alert.severity, "white")
        icon = icon_map.get(alert.severity, "📌")
        
        # Format message
        content = f"{icon} [{color}]{alert.severity.value.upper()}[/{color}]\n"
        content += f"[bold]{alert.title}[/bold]\n"
        content += f"{alert.message}\n"
        content += f"[dim]Source: {alert.source} | Time: {alert.timestamp.strftime('%H:%M:%S')}[/dim]"
        
        if alert.duplicate_count > 1:
            content += f"\n[yellow]⚡ {alert.duplicate_count} similar alerts merged[/yellow]"
        
        self.console.print(Panel(content, border_style=color))
    
    def _send_plain(self, alert: Alert):
        """Send using plain text."""
        icon_map = {
            AlertSeverity.DEBUG: "[DEBUG]",
            AlertSeverity.INFO: "[INFO]",
            AlertSeverity.WARNING: "[WARNING]",
            AlertSeverity.ERROR: "[ERROR]",
            AlertSeverity.CRITICAL: "[CRITICAL]"
        }
        
        icon = icon_map.get(alert.severity, "[ALERT]")
        
        print(f"\n{icon} {alert.title}")
        print(f"{alert.message}")
        print(f"Source: {alert.source} | Time: {alert.timestamp}")
        
        if alert.duplicate_count > 1:
            print(f"({alert.duplicate_count} similar alerts merged)")

