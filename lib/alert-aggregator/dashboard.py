"""
Alert Dashboard UI

Unified dashboard for alert visualization and management.
"""

import logging
from typing import Optional, List

try:
    from rich.console import Console
    from rich.table import Table
    from rich.live import Live
    from rich.layout import Layout
    from rich.panel import Panel
    from rich import box
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from .models import Alert, AlertSeverity, AlertStatus, AlertStats
from .aggregator import AlertAggregator

logger = logging.getLogger(__name__)


class AlertDashboard:
    """
    Unified alert dashboard.
    
    Features:
    - Real-time alert display
    - Filtering and grouping
    - Statistics visualization
    - Interactive commands
    """
    
    def __init__(self, aggregator: AlertAggregator):
        """
        Initialize dashboard.
        
        Args:
            aggregator: Alert aggregator instance
        """
        if not RICH_AVAILABLE:
            raise ImportError("rich library required for dashboard")
        
        self.aggregator = aggregator
        self.console = Console()
        self.live: Optional[Live] = None
    
    def show_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        status: Optional[AlertStatus] = None,
        limit: int = 20
    ):
        """
        Display alerts table.
        
        Args:
            severity: Filter by severity
            status: Filter by status
            limit: Maximum alerts to show
        """
        alerts = self.aggregator.get_alerts(severity, status, limit=limit)
        
        # Create table
        table = Table(
            title="🔔 Alerts",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold cyan"
        )
        
        table.add_column("ID", style="dim", width=8)
        table.add_column("Severity", width=10)
        table.add_column("Source", width=15)
        table.add_column("Title", width=30)
        table.add_column("Status", width=12)
        table.add_column("Count", justify="right", width=6)
        
        # Add rows
        for alert in alerts:
            # Severity styling
            sev_styles = {
                AlertSeverity.DEBUG: "[dim]DEBUG[/dim]",
                AlertSeverity.INFO: "[blue]INFO[/blue]",
                AlertSeverity.WARNING: "[yellow]WARNING[/yellow]",
                AlertSeverity.ERROR: "[red]ERROR[/red]",
                AlertSeverity.CRITICAL: "[red bold]CRITICAL[/red bold]"
            }
            
            # Status styling
            status_styles = {
                AlertStatus.NEW: "[yellow]NEW[/yellow]",
                AlertStatus.ACKNOWLEDGED: "[cyan]ACK[/cyan]",
                AlertStatus.IN_PROGRESS: "[blue]PROGRESS[/blue]",
                AlertStatus.RESOLVED: "[green]RESOLVED[/green]",
                AlertStatus.DISMISSED: "[dim]DISMISSED[/dim]"
            }
            
            table.add_row(
                alert.id[:8],
                sev_styles.get(alert.severity, alert.severity.value),
                alert.source,
                alert.title[:30],
                status_styles.get(alert.status, alert.status.value),
                str(alert.duplicate_count) if alert.duplicate_count > 1 else "-"
            )
        
        self.console.print(table)
    
    def show_stats(self):
        """Display alert statistics."""
        stats = self.aggregator.get_stats()
        
        # Create stats table
        table = Table(box=box.SIMPLE, show_header=False)
        table.add_column("Metric", style="bold")
        table.add_column("Value", justify="right")
        
        table.add_row("Total Alerts", str(stats.total_alerts))
        table.add_row("Duplicates Merged", str(stats.duplicates_merged))
        
        if stats.total_alerts > 0:
            dedup_rate = (stats.duplicates_merged / stats.total_alerts) * 100
            table.add_row("Deduplication Rate", f"{dedup_rate:.1f}%")
        
        table.add_row("", "")  # Spacer
        
        # By severity
        for severity, count in stats.by_severity.items():
            if count > 0:
                table.add_row(f"  {severity.upper()}", str(count))
        
        panel = Panel(table, title="📊 Statistics", border_style="cyan")
        self.console.print(panel)
    
    def show_summary(self):
        """Show dashboard summary."""
        layout = Layout()
        
        # Split into top and bottom
        layout.split_column(
            Layout(name="stats", size=10),
            Layout(name="alerts")
        )
        
        # Stats section
        stats = self.aggregator.get_stats()
        stats_table = Table(box=box.SIMPLE, show_header=False, expand=True)
        stats_table.add_column("Metric", style="bold")
        stats_table.add_column("Value", justify="right")
        
        stats_table.add_row("Total", str(stats.total_alerts))
        stats_table.add_row("Critical", f"[red]{stats.by_severity.get('critical', 0)}[/red]")
        stats_table.add_row("Error", f"[red]{stats.by_severity.get('error', 0)}[/red]")
        stats_table.add_row("Warning", f"[yellow]{stats.by_severity.get('warning', 0)}[/yellow]")
        
        layout["stats"].update(Panel(stats_table, title="📊 Summary", border_style="cyan"))
        
        # Recent alerts
        alerts = self.aggregator.get_alerts(limit=10)
        alerts_table = Table(box=box.SIMPLE, show_header=True, expand=True)
        alerts_table.add_column("Severity", width=10)
        alerts_table.add_column("Title", ratio=1)
        alerts_table.add_column("Source", width=15)
        
        for alert in alerts[:5]:  # Show top 5
            sev_map = {
                AlertSeverity.CRITICAL: "[red bold]CRIT[/red bold]",
                AlertSeverity.ERROR: "[red]ERROR[/red]",
                AlertSeverity.WARNING: "[yellow]WARN[/yellow]",
                AlertSeverity.INFO: "[blue]INFO[/blue]",
                AlertSeverity.DEBUG: "[dim]DEBUG[/dim]"
            }
            
            alerts_table.add_row(
                sev_map.get(alert.severity, alert.severity.value),
                alert.title[:40],
                alert.source
            )
        
        layout["alerts"].update(Panel(alerts_table, title="🔔 Recent Alerts", border_style="blue"))
        
        self.console.print(layout)

