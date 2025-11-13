"""
System Resource Monitoring

Optional system resource monitoring using psutil for actionable feedback.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    psutil = None


@dataclass
class ResourceSnapshot:
    """System resource usage snapshot."""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_available_gb: float
    disk_usage_percent: float
    disk_free_gb: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'cpu_percent': self.cpu_percent,
            'memory_percent': self.memory_percent,
            'memory_available_gb': self.memory_available_gb,
            'disk_usage_percent': self.disk_usage_percent,
            'disk_free_gb': self.disk_free_gb
        }
    
    def is_cpu_high(self, threshold: float = 90.0) -> bool:
        """Check if CPU usage is high."""
        return self.cpu_percent > threshold
    
    def is_memory_high(self, threshold: float = 85.0) -> bool:
        """Check if memory usage is high."""
        return self.memory_percent > threshold
    
    def is_disk_high(self, threshold: float = 90.0) -> bool:
        """Check if disk usage is high."""
        return self.disk_usage_percent > threshold


class ResourceMonitor:
    """
    System resource monitor.
    
    Tracks CPU, memory, and disk usage during workflow execution.
    Provides alerts for resource bottlenecks.
    """
    
    def __init__(self):
        """Initialize monitor."""
        if not PSUTIL_AVAILABLE:
            raise ImportError(
                "psutil is required for resource monitoring. "
                "Install with: pip install psutil"
            )
        
        self.snapshots: list[ResourceSnapshot] = []
        self.baseline: Optional[ResourceSnapshot] = None
    
    def capture_baseline(self):
        """Capture baseline resource usage."""
        self.baseline = self.get_snapshot()
    
    def get_snapshot(self) -> ResourceSnapshot:
        """
        Capture current resource usage.
        
        Returns:
            Resource snapshot
        """
        if not PSUTIL_AVAILABLE:
            raise RuntimeError("psutil not available")
        
        # CPU usage (1 second average)
        cpu_percent = psutil.cpu_percent(interval=1.0)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_available_gb = memory.available / (1024**3)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_usage_percent = disk.percent
        disk_free_gb = disk.free / (1024**3)
        
        snapshot = ResourceSnapshot(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            memory_available_gb=memory_available_gb,
            disk_usage_percent=disk_usage_percent,
            disk_free_gb=disk_free_gb
        )
        
        self.snapshots.append(snapshot)
        
        return snapshot
    
    def check_resources(
        self,
        cpu_threshold: float = 90.0,
        memory_threshold: float = 85.0,
        disk_threshold: float = 90.0
    ) -> Dict[str, Any]:
        """
        Check current resource usage and identify issues.
        
        Args:
            cpu_threshold: CPU usage alert threshold (%)
            memory_threshold: Memory usage alert threshold (%)
            disk_threshold: Disk usage alert threshold (%)
        
        Returns:
            Dictionary with alerts and recommendations
        """
        snapshot = self.get_snapshot()
        
        alerts = []
        recommendations = []
        
        # CPU check
        if snapshot.is_cpu_high(cpu_threshold):
            alerts.append({
                'type': 'cpu',
                'severity': 'high',
                'value': snapshot.cpu_percent,
                'threshold': cpu_threshold,
                'message': f'CPU usage at {snapshot.cpu_percent:.1f}%'
            })
            recommendations.append(
                'Consider reducing parallel operations or optimizing CPU-intensive tasks'
            )
        
        # Memory check
        if snapshot.is_memory_high(memory_threshold):
            alerts.append({
                'type': 'memory',
                'severity': 'high',
                'value': snapshot.memory_percent,
                'threshold': memory_threshold,
                'message': f'Memory usage at {snapshot.memory_percent:.1f}% '
                          f'({snapshot.memory_available_gb:.1f} GB available)'
            })
            recommendations.append(
                'Reduce batch sizes or implement memory-efficient algorithms'
            )
        
        # Disk check
        if snapshot.is_disk_high(disk_threshold):
            alerts.append({
                'type': 'disk',
                'severity': 'high',
                'value': snapshot.disk_usage_percent,
                'threshold': disk_threshold,
                'message': f'Disk usage at {snapshot.disk_usage_percent:.1f}% '
                          f'({snapshot.disk_free_gb:.1f} GB free)'
            })
            recommendations.append(
                'Clean up temporary files or consider expanding disk capacity'
            )
        
        return {
            'snapshot': snapshot,
            'alerts': alerts,
            'recommendations': recommendations,
            'healthy': len(alerts) == 0
        }
    
    def get_average_usage(self) -> Dict[str, float]:
        """
        Calculate average resource usage across all snapshots.
        
        Returns:
            Dictionary with average metrics
        """
        if not self.snapshots:
            return {
                'cpu_avg': 0.0,
                'memory_avg': 0.0,
                'disk_avg': 0.0
            }
        
        return {
            'cpu_avg': sum(s.cpu_percent for s in self.snapshots) / len(self.snapshots),
            'memory_avg': sum(s.memory_percent for s in self.snapshots) / len(self.snapshots),
            'disk_avg': sum(s.disk_usage_percent for s in self.snapshots) / len(self.snapshots)
        }
    
    def get_peak_usage(self) -> Dict[str, float]:
        """
        Get peak resource usage.
        
        Returns:
            Dictionary with peak metrics
        """
        if not self.snapshots:
            return {
                'cpu_peak': 0.0,
                'memory_peak': 0.0,
                'disk_peak': 0.0
            }
        
        return {
            'cpu_peak': max(s.cpu_percent for s in self.snapshots),
            'memory_peak': max(s.memory_percent for s in self.snapshots),
            'disk_peak': max(s.disk_usage_percent for s in self.snapshots)
        }
    
    def clear(self):
        """Clear snapshots."""
        self.snapshots = []
        self.baseline = None


def is_monitoring_available() -> bool:
    """Check if resource monitoring is available."""
    return PSUTIL_AVAILABLE

