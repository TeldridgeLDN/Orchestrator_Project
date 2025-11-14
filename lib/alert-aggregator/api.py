"""
RESTful API for Alert Aggregator

Provides HTTP endpoints for alert submission and retrieval.
"""

from typing import Optional
from datetime import datetime
import logging
import json

from .models import Alert, AlertSeverity, AlertStatus
from .aggregator import AlertAggregator
from .collector import AlertCollector

logger = logging.getLogger(__name__)


class AlertAPI:
    """
    RESTful API interface.
    
    Provides endpoints for:
    - Alert submission (POST /alerts)
    - Alert retrieval (GET /alerts)
    - Alert acknowledgment (POST /alerts/{id}/acknowledge)
    - Alert resolution (POST /alerts/{id}/resolve)
    - Statistics (GET /stats)
    """
    
    def __init__(self, aggregator: AlertAggregator):
        """
        Initialize API.
        
        Args:
            aggregator: Alert aggregator instance
        """
        self.aggregator = aggregator
        self.collector = AlertCollector()
    
    def submit_alert(self, data: dict) -> dict:
        """
        Submit a new alert.
        
        Args:
            data: Alert data dictionary
        
        Returns:
            Response dictionary
        """
        try:
            # Validate required fields
            required = ['source', 'severity', 'title', 'message']
            for field in required:
                if field not in data:
                    return {
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }
            
            # Collect and ingest
            alert = self.collector.collect_from_dict(data)
            result = self.aggregator.ingest(alert)
            
            return {
                'success': True,
                'alert_id': result.id,
                'fingerprint': result.fingerprint,
                'is_duplicate': result.id != alert.id,
                'duplicate_count': result.duplicate_count
            }
        
        except Exception as e:
            logger.error(f"Error submitting alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_alerts(
        self,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 100
    ) -> dict:
        """
        Retrieve alerts.
        
        Args:
            severity: Filter by severity
            status: Filter by status
            source: Filter by source
            limit: Maximum results
        
        Returns:
            Response dictionary
        """
        try:
            severity_enum = AlertSeverity(severity) if severity else None
            status_enum = AlertStatus(status) if status else None
            
            alerts = self.aggregator.get_alerts(
                severity=severity_enum,
                status=status_enum,
                source=source,
                limit=limit
            )
            
            return {
                'success': True,
                'count': len(alerts),
                'alerts': [alert.to_dict() for alert in alerts]
            }
        
        except Exception as e:
            logger.error(f"Error retrieving alerts: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def acknowledge_alert(self, alert_id: str, by: Optional[str] = None) -> dict:
        """
        Acknowledge an alert.
        
        Args:
            alert_id: Alert ID
            by: User who acknowledged
        
        Returns:
            Response dictionary
        """
        try:
            success = self.aggregator.acknowledge(alert_id, by)
            
            return {
                'success': success,
                'alert_id': alert_id,
                'acknowledged_by': by
            }
        
        except Exception as e:
            logger.error(f"Error acknowledging alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def resolve_alert(self, alert_id: str) -> dict:
        """
        Resolve an alert.
        
        Args:
            alert_id: Alert ID
        
        Returns:
            Response dictionary
        """
        try:
            success = self.aggregator.resolve(alert_id)
            
            return {
                'success': success,
                'alert_id': alert_id
            }
        
        except Exception as e:
            logger.error(f"Error resolving alert: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_stats(self) -> dict:
        """
        Get statistics.
        
        Returns:
            Response dictionary
        """
        try:
            stats = self.aggregator.get_stats()
            
            return {
                'success': True,
                'stats': stats.to_dict()
            }
        
        except Exception as e:
            logger.error(f"Error retrieving stats: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Flask integration example (optional)
def create_flask_app(aggregator: AlertAggregator):
    """
    Create Flask application.
    
    Args:
        aggregator: Alert aggregator instance
    
    Returns:
        Flask app
    """
    try:
        from flask import Flask, request, jsonify
    except ImportError:
        raise ImportError("Flask required for HTTP server")
    
    app = Flask(__name__)
    api = AlertAPI(aggregator)
    
    @app.route('/alerts', methods=['POST'])
    def submit():
        return jsonify(api.submit_alert(request.json))
    
    @app.route('/alerts', methods=['GET'])
    def get_alerts():
        return jsonify(api.get_alerts(
            severity=request.args.get('severity'),
            status=request.args.get('status'),
            source=request.args.get('source'),
            limit=int(request.args.get('limit', 100))
        ))
    
    @app.route('/alerts/<alert_id>/acknowledge', methods=['POST'])
    def acknowledge(alert_id):
        by = request.json.get('by') if request.json else None
        return jsonify(api.acknowledge_alert(alert_id, by))
    
    @app.route('/alerts/<alert_id>/resolve', methods=['POST'])
    def resolve(alert_id):
        return jsonify(api.resolve_alert(alert_id))
    
    @app.route('/stats', methods=['GET'])
    def stats():
        return jsonify(api.get_stats())
    
    return app

