"""Webhook alert channel."""

import logging
from typing import Optional
import json

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    requests = None

from ..models import Alert

logger = logging.getLogger(__name__)


class WebhookChannel:
    """Webhook output channel."""
    
    def __init__(self, url: str, timeout: int = 10):
        """
        Initialize webhook channel.
        
        Args:
            url: Webhook URL
            timeout: Request timeout (seconds)
        """
        if not REQUESTS_AVAILABLE:
            raise ImportError("requests library required for webhook channel")
        
        self.url = url
        self.timeout = timeout
    
    def send(self, alert: Alert):
        """Send alert via webhook."""
        try:
            payload = {
                'alert': alert.to_dict(),
                'event': 'alert.created'
            }
            
            response = requests.post(
                self.url,
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            response.raise_for_status()
            logger.info(f"Sent alert to webhook: {self.url}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Webhook delivery failed: {e}")
            raise

