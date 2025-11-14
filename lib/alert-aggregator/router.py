"""
Alert Routing Module

Routes alerts to appropriate channels based on severity and rules.
"""

from typing import List
import logging

from .models import Alert, AlertSeverity, RoutingRule, ChannelType

logger = logging.getLogger(__name__)


class AlertRouter:
    """
    Severity-based alert routing.
    
    Routes alerts to appropriate channels based on configurable rules.
    """
    
    def __init__(self):
        """Initialize router with default rules."""
        self.rules: List[RoutingRule] = []
        self._setup_default_rules()
    
    def _setup_default_rules(self):
        """Setup default routing rules."""
        # Critical -> All channels
        self.add_rule(RoutingRule(
            name="critical-all",
            severity_levels=[AlertSeverity.CRITICAL],
            channels=[ChannelType.CONSOLE, ChannelType.FILE, ChannelType.WEBHOOK, ChannelType.EMAIL]
        ))
        
        # Error -> Console, File, Webhook
        self.add_rule(RoutingRule(
            name="error-standard",
            severity_levels=[AlertSeverity.ERROR],
            channels=[ChannelType.CONSOLE, ChannelType.FILE, ChannelType.WEBHOOK]
        ))
        
        # Warning -> Console, File
        self.add_rule(RoutingRule(
            name="warning-basic",
            severity_levels=[AlertSeverity.WARNING],
            channels=[ChannelType.CONSOLE, ChannelType.FILE]
        ))
        
        # Info -> Console
        self.add_rule(RoutingRule(
            name="info-console",
            severity_levels=[AlertSeverity.INFO],
            channels=[ChannelType.CONSOLE]
        ))
        
        # Debug -> File only
        self.add_rule(RoutingRule(
            name="debug-file",
            severity_levels=[AlertSeverity.DEBUG],
            channels=[ChannelType.FILE]
        ))
    
    def add_rule(self, rule: RoutingRule):
        """Add a routing rule."""
        self.rules.append(rule)
        logger.debug(f"Added routing rule: {rule.name}")
    
    def route(self, alert: Alert) -> List[ChannelType]:
        """
        Determine which channels an alert should be sent to.
        
        Args:
            alert: Alert to route
        
        Returns:
            List of channel types
        """
        channels = set()
        
        for rule in self.rules:
            if rule.matches(alert):
                channels.update(rule.channels)
        
        return list(channels)
    
    def clear_rules(self):
        """Clear all routing rules."""
        self.rules = []
    
    def get_rules(self) -> List[RoutingRule]:
        """Get all routing rules."""
        return self.rules.copy()

