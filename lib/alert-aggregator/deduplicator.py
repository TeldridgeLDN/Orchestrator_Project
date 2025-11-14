"""
Alert Deduplication Module

Merges similar alerts using hash and fuzzy matching.
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
import difflib
import logging

from .models import Alert

logger = logging.getLogger(__name__)


class AlertDeduplicator:
    """
    Alert deduplication engine.
    
    Uses fingerprinting and fuzzy matching to identify duplicates.
    """
    
    def __init__(
        self,
        enabled: bool = True,
        time_window: int = 3600,  # 1 hour
        fuzzy_threshold: float = 0.85  # 85% similarity
    ):
        """
        Initialize deduplicator.
        
        Args:
            enabled: Enable deduplication
            time_window: Time window for considering duplicates (seconds)
            fuzzy_threshold: Similarity threshold for fuzzy matching (0.0-1.0)
        """
        self.enabled = enabled
        self.time_window = time_window
        self.fuzzy_threshold = fuzzy_threshold
    
    def find_duplicate(
        self,
        alert: Alert,
        active_alerts: Dict[str, Alert]
    ) -> Optional[Alert]:
        """
        Find if alert is a duplicate of an active alert.
        
        Args:
            alert: New alert to check
            active_alerts: Dictionary of active alerts (fingerprint -> alert)
        
        Returns:
            Existing alert if duplicate found, None otherwise
        """
        if not self.enabled:
            return None
        
        # Exact fingerprint match
        if alert.fingerprint in active_alerts:
            existing = active_alerts[alert.fingerprint]
            
            # Check time window
            if self._within_time_window(alert, existing):
                return existing
        
        # Fuzzy matching fallback
        return self._fuzzy_match(alert, active_alerts)
    
    def _within_time_window(self, alert1: Alert, alert2: Alert) -> bool:
        """Check if two alerts are within the deduplication time window."""
        time_diff = abs((alert1.timestamp - alert2.timestamp).total_seconds())
        return time_diff <= self.time_window
    
    def _fuzzy_match(
        self,
        alert: Alert,
        active_alerts: Dict[str, Alert]
    ) -> Optional[Alert]:
        """
        Find similar alert using fuzzy matching.
        
        Args:
            alert: Alert to match
            active_alerts: Active alerts to search
        
        Returns:
            Similar alert if found, None otherwise
        """
        best_match: Optional[Alert] = None
        best_similarity = 0.0
        
        for existing in active_alerts.values():
            # Must be same source and severity
            if existing.source != alert.source or existing.severity != alert.severity:
                continue
            
            # Check time window
            if not self._within_time_window(alert, existing):
                continue
            
            # Calculate similarity
            title_sim = difflib.SequenceMatcher(None, alert.title, existing.title).ratio()
            msg_sim = difflib.SequenceMatcher(None, alert.message, existing.message).ratio()
            
            # Weighted average (title is more important)
            similarity = (title_sim * 0.6) + (msg_sim * 0.4)
            
            if similarity > best_similarity and similarity >= self.fuzzy_threshold:
                best_similarity = similarity
                best_match = existing
        
        if best_match:
            logger.debug(f"Fuzzy match found: {best_similarity:.2%} similarity")
        
        return best_match

