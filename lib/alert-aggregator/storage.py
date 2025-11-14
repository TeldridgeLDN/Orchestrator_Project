"""
Alert Storage Module

SQLite-based alert history storage for auditability and analysis.
"""

import sqlite3
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import json

from .models import Alert, AlertSeverity, AlertStatus

logger = logging.getLogger(__name__)


class AlertStorage:
    """
    SQLite-based alert storage.
    
    Features:
    - Persistent alert history
    - Efficient querying
    - Automatic schema management
    """
    
    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize storage.
        
        Args:
            db_path: Path to SQLite database file
        """
        if db_path is None:
            db_path = Path.home() / '.alert-aggregator' / 'alerts.db'
        
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        self._init_schema()
        logger.info(f"Initialized alert storage: {self.db_path}")
    
    def _init_schema(self):
        """Initialize database schema."""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL,
                tags TEXT,
                metadata TEXT,
                fingerprint TEXT,
                duplicate_count INTEGER DEFAULT 1,
                first_seen TEXT,
                last_seen TEXT,
                acknowledged_at TEXT,
                resolved_at TEXT,
                acknowledged_by TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Indexes for common queries
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_severity ON alerts(severity)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON alerts(status)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_source ON alerts(source)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON alerts(timestamp)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_fingerprint ON alerts(fingerprint)")
        
        self.conn.commit()
    
    def store_alert(self, alert: Alert):
        """
        Store a new alert.
        
        Args:
            alert: Alert to store
        """
        self.conn.execute("""
            INSERT INTO alerts (
                id, source, severity, title, message, timestamp, status,
                tags, metadata, fingerprint, duplicate_count,
                first_seen, last_seen, acknowledged_at, resolved_at, acknowledged_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert.id,
            alert.source,
            alert.severity.value,
            alert.title,
            alert.message,
            alert.timestamp.isoformat(),
            alert.status.value,
            json.dumps(alert.tags),
            json.dumps(alert.metadata),
            alert.fingerprint,
            alert.duplicate_count,
            alert.first_seen.isoformat() if alert.first_seen else None,
            alert.last_seen.isoformat() if alert.last_seen else None,
            alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            alert.resolved_at.isoformat() if alert.resolved_at else None,
            alert.acknowledged_by
        ))
        
        self.conn.commit()
        logger.debug(f"Stored alert: {alert.id}")
    
    def update_alert(self, alert: Alert):
        """
        Update an existing alert.
        
        Args:
            alert: Alert to update
        """
        self.conn.execute("""
            UPDATE alerts SET
                status = ?,
                duplicate_count = ?,
                last_seen = ?,
                acknowledged_at = ?,
                resolved_at = ?,
                acknowledged_by = ?,
                metadata = ?
            WHERE id = ?
        """, (
            alert.status.value,
            alert.duplicate_count,
            alert.last_seen.isoformat() if alert.last_seen else None,
            alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            alert.resolved_at.isoformat() if alert.resolved_at else None,
            alert.acknowledged_by,
            json.dumps(alert.metadata),
            alert.id
        ))
        
        self.conn.commit()
    
    def get_alert(self, alert_id: str) -> Optional[Alert]:
        """
        Retrieve alert by ID.
        
        Args:
            alert_id: Alert ID
        
        Returns:
            Alert if found, None otherwise
        """
        cursor = self.conn.execute(
            "SELECT * FROM alerts WHERE id = ?",
            (alert_id,)
        )
        
        row = cursor.fetchone()
        
        if row:
            return self._row_to_alert(row)
        
        return None
    
    def query_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        status: Optional[AlertStatus] = None,
        source: Optional[str] = None,
        limit: int = 100
    ) -> List[Alert]:
        """
        Query alerts with filters.
        
        Args:
            severity: Filter by severity
            status: Filter by status
            source: Filter by source
            limit: Maximum results
        
        Returns:
            List of alerts
        """
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        
        if severity:
            query += " AND severity = ?"
            params.append(severity.value)
        
        if status:
            query += " AND status = ?"
            params.append(status.value)
        
        if source:
            query += " AND source = ?"
            params.append(source)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor = self.conn.execute(query, params)
        
        return [self._row_to_alert(row) for row in cursor.fetchall()]
    
    def cleanup_old(self, days: int = 30) -> int:
        """
        Remove old resolved alerts.
        
        Args:
            days: Remove alerts older than this
        
        Returns:
            Number of alerts removed
        """
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor = self.conn.execute("""
            DELETE FROM alerts
            WHERE status = 'resolved'
            AND resolved_at < ?
        """, (cutoff,))
        
        self.conn.commit()
        
        return cursor.rowcount
    
    def _row_to_alert(self, row: sqlite3.Row) -> Alert:
        """Convert database row to Alert."""
        return Alert(
            id=row['id'],
            source=row['source'],
            severity=AlertSeverity(row['severity']),
            title=row['title'],
            message=row['message'],
            timestamp=datetime.fromisoformat(row['timestamp']),
            status=AlertStatus(row['status']),
            tags=json.loads(row['tags']) if row['tags'] else [],
            metadata=json.loads(row['metadata']) if row['metadata'] else {},
            fingerprint=row['fingerprint'],
            duplicate_count=row['duplicate_count'],
            first_seen=datetime.fromisoformat(row['first_seen']) if row['first_seen'] else None,
            last_seen=datetime.fromisoformat(row['last_seen']) if row['last_seen'] else None,
            acknowledged_at=datetime.fromisoformat(row['acknowledged_at']) if row['acknowledged_at'] else None,
            resolved_at=datetime.fromisoformat(row['resolved_at']) if row['resolved_at'] else None,
            acknowledged_by=row['acknowledged_by']
        )
    
    def get_stats(self) -> dict:
        """Get database statistics."""
        cursor = self.conn.execute("SELECT COUNT(*) as total FROM alerts")
        total = cursor.fetchone()['total']
        
        cursor = self.conn.execute("""
            SELECT severity, COUNT(*) as count
            FROM alerts
            GROUP BY severity
        """)
        by_severity = {row['severity']: row['count'] for row in cursor.fetchall()}
        
        return {
            'total_alerts': total,
            'by_severity': by_severity,
            'database_size': self.db_path.stat().st_size if self.db_path.exists() else 0
        }
    
    def close(self):
        """Close database connection."""
        self.conn.close()
        logger.info("Closed alert storage")

