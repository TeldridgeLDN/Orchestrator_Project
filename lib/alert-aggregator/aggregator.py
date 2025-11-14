"""
Alert Aggregator Core Engine

Central orchestration for alert ingestion, deduplication, routing, and storage.
"""

from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
import logging
from pathlib import Path

from .models import Alert, AlertSeverity, AlertStatus, RoutingRule, AlertStats, ChannelType
from .deduplicator import AlertDeduplicator
from .router import AlertRouter
from .storage import AlertStorage

logger = logging.getLogger(__name__)


class AlertAggregator:
    """
    Central alert aggregation engine.
    
    Features:
    - Alert ingestion from multiple sources
    - Automatic deduplication
    - Severity-based routing
    - History storage
    - Real-time statistics
    """
    
    def __init__(
        self,
        storage_path: Optional[Path] = None,
        deduplication_enabled: bool = True,
        deduplication_window: int = 3600  # 1 hour default
    ):
        """
        Initialize aggregator.
        
        Args:
            storage_path: Path to SQLite database
            deduplication_enabled: Enable deduplication
            deduplication_window: Time window for deduplication (seconds)
        """
        # Components
        self.storage = AlertStorage(storage_path)
        self.deduplicator = AlertDeduplicator(
            enabled=deduplication_enabled,
            time_window=deduplication_window
        )
        self.router = AlertRouter()
        
        # State
        self.active_alerts: Dict[str, Alert] = {}  # fingerprint -> alert
        self.stats = AlertStats()
        
        # Callbacks
        self.callbacks: List[Callable] = []
        
        logger.info("AlertAggregator initialized")
    
    def ingest(self, alert: Alert) -> Alert:
        """
        Ingest a new alert.
        
        Args:
            alert: Alert to ingest
        
        Returns:
            Processed alert (original or merged duplicate)
        """
        # Check for duplicates
        if self.deduplicator.enabled:
            existing = self.deduplicator.find_duplicate(alert, self.active_alerts)
            
            if existing:
                # Merge as duplicate
                existing.merge_duplicate(alert)
                logger.debug(f"Merged duplicate alert: {alert.fingerprint} (count: {existing.duplicate_count})")
                
                # Update storage
                self.storage.update_alert(existing)
                
                # Update stats
                self.stats.duplicates_merged += 1
                
                # Trigger callbacks
                self._trigger_callbacks('duplicate_merged', existing)
                
                return existing
        
        # New unique alert
        self.active_alerts[alert.fingerprint] = alert
        
        # Store in database
        self.storage.store_alert(alert)
        
        # Update stats
        self.stats.update(alert)
        
        # Route to channels
        self._route_alert(alert)
        
        # Trigger callbacks
        self._trigger_callbacks('alert_ingested', alert)
        
        logger.info(f"Ingested alert: {alert.id} [{alert.severity.value}] {alert.title}")
        
        return alert
    
    def _route_alert(self, alert: Alert):
        """
        Route alert to appropriate channels.
        
        Args:
            alert: Alert to route
        """
        channels = self.router.route(alert)
        
        if channels:
            logger.debug(f"Routing alert {alert.id} to channels: {[c.value for c in channels]}")
            self._trigger_callbacks('alert_routed', {'alert': alert, 'channels': channels})
    
    def acknowledge(self, alert_id: str, by: Optional[str] = None) -> bool:
        """
        Acknowledge an alert.
        
        Args:
            alert_id: Alert ID to acknowledge
            by: User who acknowledged
        
        Returns:
            True if successful
        """
        alert = self.storage.get_alert(alert_id)
        
        if not alert:
            logger.warning(f"Alert not found: {alert_id}")
            return False
        
        alert.acknowledge(by)
        self.storage.update_alert(alert)
        
        # Update active alerts if present
        if alert.fingerprint in self.active_alerts:
            self.active_alerts[alert.fingerprint] = alert
        
        self._trigger_callbacks('alert_acknowledged', alert)
        logger.info(f"Acknowledged alert: {alert_id}")
        
        return True
    
    def resolve(self, alert_id: str) -> bool:
        """
        Resolve an alert.
        
        Args:
            alert_id: Alert ID to resolve
        
        Returns:
            True if successful
        """
        alert = self.storage.get_alert(alert_id)
        
        if not alert:
            logger.warning(f"Alert not found: {alert_id}")
            return False
        
        alert.resolve()
        self.storage.update_alert(alert)
        
        # Remove from active alerts
        if alert.fingerprint in self.active_alerts:
            del self.active_alerts[alert.fingerprint]
        
        self._trigger_callbacks('alert_resolved', alert)
        logger.info(f"Resolved alert: {alert_id}")
        
        return True
    
    def get_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        status: Optional[AlertStatus] = None,
        source: Optional[str] = None,
        limit: int = 100
    ) -> List[Alert]:
        """
        Query alerts.
        
        Args:
            severity: Filter by severity
            status: Filter by status
            source: Filter by source
            limit: Maximum results
        
        Returns:
            List of alerts
        """
        return self.storage.query_alerts(
            severity=severity,
            status=status,
            source=source,
            limit=limit
        )
    
    def get_stats(self) -> AlertStats:
        """Get current statistics."""
        return self.stats
    
    def add_routing_rule(self, rule: RoutingRule):
        """
        Add a routing rule.
        
        Args:
            rule: Routing rule to add
        """
        self.router.add_rule(rule)
        logger.info(f"Added routing rule: {rule.name}")
    
    def add_callback(self, callback: Callable):
        """
        Add event callback.
        
        Args:
            callback: Function to call on events
                     Signature: callback(event_type, data)
        """
        self.callbacks.append(callback)
    
    def _trigger_callbacks(self, event_type: str, data: Any):
        """Trigger all registered callbacks."""
        for callback in self.callbacks:
            try:
                callback(event_type, data)
            except Exception as e:
                logger.error(f"Error in callback: {e}")
    
    def cleanup_old_alerts(self, days: int = 30):
        """
        Clean up old resolved alerts.
        
        Args:
            days: Remove alerts older than this many days
        """
        count = self.storage.cleanup_old(days)
        logger.info(f"Cleaned up {count} old alerts")
        return count
    
    def close(self):
        """Close aggregator and cleanup resources."""
        self.storage.close()
        logger.info("AlertAggregator closed")

