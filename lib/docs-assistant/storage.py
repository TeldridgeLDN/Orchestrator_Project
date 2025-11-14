"""
Usage Storage

SQLite-based storage for queries, suggestions, and feedback.
"""

import logging
import sqlite3
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime
import json

from .models import Context, Suggestion, Feedback

logger = logging.getLogger(__name__)


class UsageStorage:
    """
    SQLite storage for usage tracking.
    
    Stores:
    - Query history
    - Suggestion history
    - User feedback
    - Performance metrics
    """
    
    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize storage.
        
        Args:
            db_path: Path to SQLite database
        """
        if db_path is None:
            db_path = str(Path.home() / '.docs-assistant' / 'usage.db')
        
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        
        self._create_tables()
        
        logger.info(f"Storage initialized at {self.db_path}")
    
    def _create_tables(self):
        """Create database tables."""
        cursor = self.conn.cursor()
        
        # Queries table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                contexts TEXT,
                response_time_ms REAL,
                suggestion_count INTEGER,
                timestamp TEXT NOT NULL
            )
        """)
        
        # Suggestions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS suggestions (
                id TEXT PRIMARY KEY,
                query_id INTEGER,
                type TEXT,
                title TEXT,
                source TEXT,
                relevance_score REAL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (query_id) REFERENCES queries(id)
            )
        """)
        
        # Feedback table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                suggestion_id TEXT NOT NULL,
                context_hash TEXT NOT NULL,
                accepted INTEGER NOT NULL,
                helpful INTEGER,
                comment TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (suggestion_id) REFERENCES suggestions(id)
            )
        """)
        
        # Indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_queries_timestamp 
            ON queries(timestamp)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_suggestions_query_id 
            ON suggestions(query_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_feedback_suggestion_id 
            ON feedback(suggestion_id)
        """)
        
        self.conn.commit()
    
    def log_query(
        self,
        query: str,
        contexts: List[Context],
        suggestions: List[Suggestion],
        response_time_ms: float
    ) -> int:
        """
        Log a query.
        
        Args:
            query: User query
            contexts: Contexts used
            suggestions: Suggestions returned
            response_time_ms: Response time
        
        Returns:
            Query ID
        """
        cursor = self.conn.cursor()
        
        # Serialize contexts
        contexts_json = json.dumps([c.to_dict() for c in contexts])
        
        # Insert query
        cursor.execute("""
            INSERT INTO queries (query, contexts, response_time_ms, suggestion_count, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            query,
            contexts_json,
            response_time_ms,
            len(suggestions),
            datetime.now().isoformat()
        ))
        
        query_id = cursor.lastrowid
        
        # Insert suggestions
        for suggestion in suggestions:
            cursor.execute("""
                INSERT INTO suggestions (id, query_id, type, title, source, relevance_score, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                suggestion.id,
                query_id,
                suggestion.type.value,
                suggestion.title,
                suggestion.source,
                suggestion.relevance_score,
                datetime.now().isoformat()
            ))
        
        self.conn.commit()
        
        logger.debug(f"Logged query {query_id}")
        
        return query_id
    
    def log_feedback(self, feedback: Feedback):
        """
        Log user feedback.
        
        Args:
            feedback: User feedback
        """
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO feedback (suggestion_id, context_hash, accepted, helpful, comment, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            feedback.suggestion_id,
            feedback.context_hash,
            1 if feedback.accepted else 0,
            1 if feedback.helpful else 0 if feedback.helpful is False else None,
            feedback.comment,
            feedback.timestamp.isoformat()
        ))
        
        self.conn.commit()
        
        logger.debug(f"Logged feedback for suggestion {feedback.suggestion_id}")
    
    def get_recent_queries(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent queries.
        
        Args:
            limit: Maximum queries to return
        
        Returns:
            List of query records
        """
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT * FROM queries
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_feedback_stats(self) -> Dict[str, Any]:
        """
        Get feedback statistics.
        
        Returns:
            Statistics dictionary
        """
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN accepted = 1 THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN accepted = 0 THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN helpful = 1 THEN 1 ELSE 0 END) as helpful
            FROM feedback
        """)
        
        row = cursor.fetchone()
        
        total = row['total'] or 0
        accepted = row['accepted'] or 0
        
        return {
            'total_feedback': total,
            'accepted': accepted,
            'rejected': row['rejected'] or 0,
            'helpful': row['helpful'] or 0,
            'acceptance_rate': accepted / total if total > 0 else 0.0
        }
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Storage closed")

