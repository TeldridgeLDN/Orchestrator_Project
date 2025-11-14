"""
Alert Aggregator Data Models

Defines core data structures for alerts, severity, and channels.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List
import hashlib
import json


class AlertSeverity(Enum):
    """Alert severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertStatus(Enum):
    """Alert lifecycle status."""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ChannelType(Enum):
    """Alert delivery channel types."""
    CONSOLE = "console"
    FILE = "file"
    WEBHOOK = "webhook"
    EMAIL = "email"


@dataclass
class Alert:
    """
    Core alert model.
    
    Represents a single alert from any source with normalized fields.
    """
    id: str  # Unique alert identifier
    source: str  # Source system/module
    severity: AlertSeverity
    title: str
    message: str
    timestamp: datetime
    
    # Optional fields
    status: AlertStatus = AlertStatus.NEW
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Deduplication fields
    fingerprint: Optional[str] = None  # Hash for deduplication
    duplicate_count: int = 1  # Number of duplicates merged
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    
    # Tracking fields
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    
    def __post_init__(self):
        """Post-initialization processing."""
        if self.first_seen is None:
            self.first_seen = self.timestamp
        if self.last_seen is None:
            self.last_seen = self.timestamp
        if self.fingerprint is None:
            self.fingerprint = self.compute_fingerprint()
    
    def compute_fingerprint(self) -> str:
        """
        Compute alert fingerprint for deduplication.
        
        Returns:
            Hash string
        """
        # Create a canonical representation for hashing
        canonical = {
            'source': self.source,
            'severity': self.severity.value,
            'title': self.title,
            'message': self.message
        }
        
        # Normalize and hash
        canonical_str = json.dumps(canonical, sort_keys=True)
        return hashlib.sha256(canonical_str.encode()).hexdigest()[:16]
    
    def merge_duplicate(self, other: 'Alert'):
        """
        Merge another alert as a duplicate.
        
        Args:
            other: Duplicate alert to merge
        """
        self.duplicate_count += 1
        self.last_seen = max(self.last_seen or self.timestamp, other.timestamp)
        
        # Merge metadata
        for key, value in other.metadata.items():
            if key not in self.metadata:
                self.metadata[key] = value
    
    def acknowledge(self, by: Optional[str] = None):
        """Mark alert as acknowledged."""
        self.status = AlertStatus.ACKNOWLEDGED
        self.acknowledged_at = datetime.now()
        self.acknowledged_by = by
    
    def resolve(self):
        """Mark alert as resolved."""
        self.status = AlertStatus.RESOLVED
        self.resolved_at = datetime.now()
    
    def dismiss(self):
        """Mark alert as dismissed."""
        self.status = AlertStatus.DISMISSED
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary.
        
        Returns:
            Dictionary representation
        """
        return {
            'id': self.id,
            'source': self.source,
            'severity': self.severity.value,
            'title': self.title,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'status': self.status.value,
            'tags': self.tags,
            'metadata': self.metadata,
            'fingerprint': self.fingerprint,
            'duplicate_count': self.duplicate_count,
            'first_seen': self.first_seen.isoformat() if self.first_seen else None,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'acknowledged_by': self.acknowledged_by
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Alert':
        """
        Create from dictionary.
        
        Args:
            data: Dictionary representation
        
        Returns:
            Alert instance
        """
        return cls(
            id=data['id'],
            source=data['source'],
            severity=AlertSeverity(data['severity']),
            title=data['title'],
            message=data['message'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            status=AlertStatus(data.get('status', 'new')),
            tags=data.get('tags', []),
            metadata=data.get('metadata', {}),
            fingerprint=data.get('fingerprint'),
            duplicate_count=data.get('duplicate_count', 1),
            first_seen=datetime.fromisoformat(data['first_seen']) if data.get('first_seen') else None,
            last_seen=datetime.fromisoformat(data['last_seen']) if data.get('last_seen') else None,
            acknowledged_at=datetime.fromisoformat(data['acknowledged_at']) if data.get('acknowledged_at') else None,
            resolved_at=datetime.fromisoformat(data['resolved_at']) if data.get('resolved_at') else None,
            acknowledged_by=data.get('acknowledged_by')
        )


@dataclass
class RoutingRule:
    """Alert routing rule."""
    name: str
    severity_levels: List[AlertSeverity]
    channels: List[ChannelType]
    tags: List[str] = field(default_factory=list)  # Optional tag filter
    sources: List[str] = field(default_factory=list)  # Optional source filter
    
    def matches(self, alert: Alert) -> bool:
        """
        Check if alert matches this rule.
        
        Args:
            alert: Alert to check
        
        Returns:
            True if matches
        """
        # Check severity
        if alert.severity not in self.severity_levels:
            return False
        
        # Check source filter (if specified)
        if self.sources and alert.source not in self.sources:
            return False
        
        # Check tag filter (if specified)
        if self.tags:
            if not any(tag in alert.tags for tag in self.tags):
                return False
        
        return True


@dataclass
class AlertStats:
    """Alert statistics."""
    total_alerts: int = 0
    by_severity: Dict[str, int] = field(default_factory=lambda: {
        'debug': 0,
        'info': 0,
        'warning': 0,
        'error': 0,
        'critical': 0
    })
    by_status: Dict[str, int] = field(default_factory=lambda: {
        'new': 0,
        'acknowledged': 0,
        'in_progress': 0,
        'resolved': 0,
        'dismissed': 0
    })
    by_source: Dict[str, int] = field(default_factory=dict)
    duplicates_merged: int = 0
    
    def update(self, alert: Alert):
        """
        Update statistics with new alert.
        
        Args:
            alert: Alert to include in stats
        """
        self.total_alerts += 1
        self.by_severity[alert.severity.value] += 1
        self.by_status[alert.status.value] += 1
        
        if alert.source not in self.by_source:
            self.by_source[alert.source] = 0
        self.by_source[alert.source] += 1
        
        if alert.duplicate_count > 1:
            self.duplicates_merged += (alert.duplicate_count - 1)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'total_alerts': self.total_alerts,
            'by_severity': self.by_severity,
            'by_status': self.by_status,
            'by_source': self.by_source,
            'duplicates_merged': self.duplicates_merged,
            'deduplication_rate': (
                self.duplicates_merged / self.total_alerts * 100
                if self.total_alerts > 0 else 0.0
            )
        }

