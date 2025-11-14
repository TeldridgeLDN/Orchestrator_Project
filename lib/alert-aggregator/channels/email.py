"""Email alert channel."""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List

from ..models import Alert, AlertSeverity

logger = logging.getLogger(__name__)


class EmailChannel:
    """Email output channel using SMTP."""
    
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        from_addr: str,
        to_addrs: List[str],
        username: str = None,
        password: str = None,
        use_tls: bool = True
    ):
        """
        Initialize email channel.
        
        Args:
            smtp_host: SMTP server hostname
            smtp_port: SMTP server port
            from_addr: Sender email address
            to_addrs: List of recipient email addresses
            username: SMTP username (if auth required)
            password: SMTP password (if auth required)
            use_tls: Use TLS encryption
        """
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.from_addr = from_addr
        self.to_addrs = to_addrs
        self.username = username
        self.password = password
        self.use_tls = use_tls
    
    def send(self, alert: Alert):
        """Send alert via email."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[{alert.severity.value.upper()}] {alert.title}"
            msg['From'] = self.from_addr
            msg['To'] = ', '.join(self.to_addrs)
            
            # Create HTML and plain text versions
            text_body = self._format_text(alert)
            html_body = self._format_html(alert)
            
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                
                if self.username and self.password:
                    server.login(self.username, self.password)
                
                server.send_message(msg)
            
            logger.info(f"Sent alert email to {len(self.to_addrs)} recipients")
        
        except Exception as e:
            logger.error(f"Email delivery failed: {e}")
            raise
    
    def _format_text(self, alert: Alert) -> str:
        """Format alert as plain text."""
        text = f"{alert.title}\n"
        text += "=" * len(alert.title) + "\n\n"
        text += f"Severity: {alert.severity.value.upper()}\n"
        text += f"Source: {alert.source}\n"
        text += f"Time: {alert.timestamp}\n"
        
        if alert.duplicate_count > 1:
            text += f"Duplicates: {alert.duplicate_count} similar alerts merged\n"
        
        text += f"\n{alert.message}\n"
        
        if alert.tags:
            text += f"\nTags: {', '.join(alert.tags)}\n"
        
        return text
    
    def _format_html(self, alert: Alert) -> str:
        """Format alert as HTML."""
        color_map = {
            AlertSeverity.DEBUG: "#6c757d",
            AlertSeverity.INFO: "#0dcaf0",
            AlertSeverity.WARNING: "#ffc107",
            AlertSeverity.ERROR: "#dc3545",
            AlertSeverity.CRITICAL: "#dc3545"
        }
        
        color = color_map.get(alert.severity, "#000000")
        
        html = f"""
        <html>
        <head><style>
            body {{ font-family: Arial, sans-serif; }}
            .header {{ background-color: {color}; color: white; padding: 10px; }}
            .content {{ padding: 15px; }}
            .meta {{ color: #666; font-size: 0.9em; }}
            .tags {{ margin-top: 10px; }}
            .tag {{ display: inline-block; background: #e9ecef; padding: 2px 8px; margin: 2px; border-radius: 3px; }}
        </style></head>
        <body>
            <div class="header">
                <h2>{alert.severity.value.upper()}: {alert.title}</h2>
            </div>
            <div class="content">
                <p>{alert.message}</p>
                <div class="meta">
                    <strong>Source:</strong> {alert.source}<br>
                    <strong>Time:</strong> {alert.timestamp}
        """
        
        if alert.duplicate_count > 1:
            html += f"<br><strong>Duplicates:</strong> {alert.duplicate_count} similar alerts merged"
        
        html += "</div>"
        
        if alert.tags:
            html += '<div class="tags">'
            for tag in alert.tags:
                html += f'<span class="tag">{tag}</span>'
            html += '</div>'
        
        html += "</div></body></html>"
        
        return html

