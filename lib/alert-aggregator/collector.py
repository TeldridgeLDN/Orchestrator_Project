"""
Alert Collection Module

Ingests alerts from multiple sources and normalizes formats.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import logging

from .models import Alert, AlertSeverity

logger = logging.getLogger(__name__)


class AlertCollector:
    """
    Alert ingestion and normalization.
    
    Handles alerts from various sources and converts to standard format.
    """
    
    def __init__(self):
        """Initialize collector."""
        self.source_count: Dict[str, int] = {}
    
    def collect(
        self,
        source: str,
        severity: str,
        title: str,
        message: str,
        tags: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ) -> Alert:
        """
        Collect and normalize an alert.
        
        Args:
            source: Source system identifier
            severity: Severity level (debug/info/warning/error/critical)
            title: Alert title
            message: Alert message
            tags: Optional tags
            metadata: Optional metadata
            timestamp: Optional timestamp (defaults to now)
        
        Returns:
            Normalized Alert object
        """
        # Generate unique ID
        alert_id = str(uuid.uuid4())
        
        # Normalize severity
        try:
            severity_enum = AlertSeverity(severity.lower())
        except ValueError:
            logger.warning(f"Invalid severity '{severity}', defaulting to INFO")
            severity_enum = AlertSeverity.INFO
        
        # Create alert
        alert = Alert(
            id=alert_id,
            source=source,
            severity=severity_enum,
            title=title,
            message=message,
            timestamp=timestamp or datetime.now(),
            tags=tags or [],
            metadata=metadata or {}
        )
        
        # Track source
        self.source_count[source] = self.source_count.get(source, 0) + 1
        
        logger.debug(f"Collected alert from {source}: {title}")
        
        return alert
    
    def collect_from_dict(self, data: Dict[str, Any]) -> Alert:
        """
        Collect alert from dictionary.
        
        Args:
            data: Dictionary with alert data
        
        Returns:
            Normalized Alert
        """
        return self.collect(
            source=data.get('source', 'unknown'),
            severity=data.get('severity', 'info'),
            title=data.get('title', 'Untitled Alert'),
            message=data.get('message', ''),
            tags=data.get('tags'),
            metadata=data.get('metadata'),
            timestamp=datetime.fromisoformat(data['timestamp']) if 'timestamp' in data else None
        )
    
    def get_source_stats(self) -> Dict[str, int]:
        """Get statistics by source."""
        return self.source_count.copy()

