"""
Alert Aggregator

Centralized alert management system with deduplication, routing, and history.
"""

from .models import Alert, AlertSeverity, AlertStatus, RoutingRule, AlertStats
from .aggregator import AlertAggregator
from .collector import AlertCollector
from .deduplicator import AlertDeduplicator
from .router import AlertRouter
from .storage import AlertStorage
from .dashboard import AlertDashboard
from .api import AlertAPI, create_flask_app
from .channels import ConsoleChannel, FileChannel, WebhookChannel, EmailChannel

__version__ = "1.0.0"

__all__ = [
    # Models
    'Alert',
    'AlertSeverity',
    'AlertStatus',
    'RoutingRule',
    'AlertStats',
    
    # Core
    'AlertAggregator',
    'AlertCollector',
    'AlertDeduplicator',
    'AlertRouter',
    'AlertStorage',
    
    # UI & API
    'AlertDashboard',
    'AlertAPI',
    'create_flask_app',
    
    # Channels
    'ConsoleChannel',
    'FileChannel',
    'WebhookChannel',
    'EmailChannel',
]

