"""File alert channel."""

import logging
from pathlib import Path
from datetime import datetime
import json

from ..models import Alert

logger = logging.getLogger(__name__)


class FileChannel:
    """File output channel."""
    
    def __init__(self, output_dir: Path = Path("logs/alerts")):
        """
        Initialize file channel.
        
        Args:
            output_dir: Directory for alert log files
        """
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def send(self, alert: Alert):
        """Write alert to file."""
        # Daily log file
        date_str = datetime.now().strftime('%Y-%m-%d')
        log_file = self.output_dir / f"alerts-{date_str}.jsonl"
        
        # Append alert as JSON line
        with open(log_file, 'a') as f:
            f.write(json.dumps(alert.to_dict()) + '\n')
        
        logger.debug(f"Wrote alert to {log_file}")

