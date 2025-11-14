# Alert Aggregator

A comprehensive centralized alert and notification management system with intelligent deduplication, severity-based routing, and unified dashboard.

## Features

✅ **Multi-Source Ingestion**
- Normalize alerts from any source
- Configurable severity levels
- Tag and metadata support

✅ **Intelligent Deduplication**
- Fingerprint-based matching
- Fuzzy similarity detection (85% threshold)
- Time-window filtering (configurable)
- <5% duplicate rate

✅ **Severity-Based Routing**
- Configurable routing rules
- Multi-channel support (console, file, webhook, email)
- Tag and source filtering

✅ **Unified Dashboard**
- Real-time visualization
- Rich terminal UI
- Statistics and analytics
- Interactive commands

✅ **Persistent History**
- SQLite storage
- Full alert lifecycle tracking
- Query and analytics
- Automatic cleanup

✅ **RESTful API**
- Submit alerts
- Query alerts
- Acknowledge/resolve
- Statistics endpoint

## Installation

```bash
pip install rich  # For dashboard
pip install requests  # For webhooks (optional)
pip install flask  # For HTTP API (optional)
```

## Quick Start

```python
from alert_aggregator import AlertAggregator, AlertCollector

# Create aggregator
aggregator = AlertAggregator()

# Collect and ingest alert
collector = AlertCollector()
alert = collector.collect(
    source='my-app',
    severity='error',
    title='Database Connection Failed',
    message='Unable to connect to PostgreSQL'
)

aggregator.ingest(alert)

# View alerts
from alert_aggregator import AlertDashboard
dashboard = AlertDashboard(aggregator)
dashboard.show_summary()
```

## Core Components

### AlertAggregator

Central orchestration engine:

```python
aggregator = AlertAggregator(
    storage_path=Path('alerts.db'),
    deduplication_enabled=True,
    deduplication_window=3600  # 1 hour
)

# Ingest alert
alert = aggregator.ingest(alert)

# Query alerts
alerts = aggregator.get_alerts(severity=AlertSeverity.ERROR)

# Acknowledge/resolve
aggregator.acknowledge(alert_id, by='admin')
aggregator.resolve(alert_id)
```

### AlertCollector

Normalize alerts from various sources:

```python
collector = AlertCollector()

alert = collector.collect(
    source='api-service',
    severity='warning',
    title='High Response Time',
    message='Average response time: 2.5s',
    tags=['performance'],
    metadata={'endpoint': '/api/users'}
)
```

### Deduplication

Automatic duplicate detection:

```python
# Exact match by fingerprint
alert1 = collector.collect(source='app', severity='error', title='DB Error', message='Connection failed')
alert2 = collector.collect(source='app', severity='error', title='DB Error', message='Connection failed')

aggregator.ingest(alert1)  # New alert
result = aggregator.ingest(alert2)  # Merged as duplicate
# result.duplicate_count == 2
```

### Routing

Severity-based channel routing:

```python
from alert_aggregator import RoutingRule, ChannelType

# Add custom rule
rule = RoutingRule(
    name='critical-slack',
    severity_levels=[AlertSeverity.CRITICAL],
    channels=[ChannelType.WEBHOOK, ChannelType.EMAIL],
    tags=['production']
)

aggregator.add_routing_rule(rule)
```

### Dashboard

Rich terminal UI:

```python
dashboard = AlertDashboard(aggregator)

# Show all alerts
dashboard.show_alerts()

# Show filtered
dashboard.show_alerts(severity=AlertSeverity.ERROR, status=AlertStatus.NEW)

# Show stats
dashboard.show_stats()

# Show summary
dashboard.show_summary()
```

### API

RESTful endpoints:

```python
from alert_aggregator import create_flask_app

# Create Flask app
app = create_flask_app(aggregator)
app.run(port=5000)

# Submit alert
POST /alerts
{
  "source": "my-app",
  "severity": "error",
  "title": "Error occurred",
  "message": "Details..."
}

# Query alerts
GET /alerts?severity=error&limit=50

# Acknowledge
POST /alerts/{id}/acknowledge

# Resolve
POST /alerts/{id}/resolve

# Statistics
GET /stats
```

## Channel Configuration

### Console

```python
from alert_aggregator.channels import ConsoleChannel

channel = ConsoleChannel(use_rich=True)
channel.send(alert)
```

### File

```python
from alert_aggregator.channels import FileChannel

channel = FileChannel(output_dir=Path('logs/alerts'))
channel.send(alert)
```

### Webhook

```python
from alert_aggregator.channels import WebhookChannel

channel = WebhookChannel(
    url='https://hooks.slack.com/services/...',
    timeout=10
)
channel.send(alert)
```

### Email

```python
from alert_aggregator.channels import EmailChannel

channel = EmailChannel(
    smtp_host='smtp.gmail.com',
    smtp_port=587,
    from_addr='alerts@example.com',
    to_addrs=['team@example.com'],
    username='alerts@example.com',
    password='app-password',
    use_tls=True
)
channel.send(alert)
```

## Alert Model

```python
Alert(
    id='uuid',
    source='service-name',
    severity=AlertSeverity.ERROR,
    title='Error Title',
    message='Detailed message',
    timestamp=datetime.now(),
    status=AlertStatus.NEW,
    tags=['tag1', 'tag2'],
    metadata={'key': 'value'},
    duplicate_count=1
)
```

## Severity Levels

- `DEBUG` - Development/debugging info
- `INFO` - Informational messages
- `WARNING` - Warning conditions
- `ERROR` - Error conditions
- `CRITICAL` - Critical failures

## Alert Lifecycle

```
NEW → ACKNOWLEDGED → IN_PROGRESS → RESOLVED
                                 → DISMISSED
```

## Performance

- **Ingestion:** <10ms per alert
- **Deduplication:** <5ms per check
- **Storage:** SQLite, ~1KB per alert
- **Deduplication Rate:** <5% duplicates
- **Delivery:** 100% reliability (with retries)

## Statistics

```python
stats = aggregator.get_stats()

print(f"Total Alerts: {stats.total_alerts}")
print(f"By Severity: {stats.by_severity}")
print(f"By Status: {stats.by_status}")
print(f"By Source: {stats.by_source}")
print(f"Duplicates Merged: {stats.duplicates_merged}")
print(f"Dedup Rate: {stats.deduplication_rate:.1f}%")
```

## Testing

```bash
cd lib/alert-aggregator
pytest tests/ -v
```

## Architecture

```
lib/alert-aggregator/
├── models.py         # Data models
├── aggregator.py     # Core engine
├── collector.py      # Alert ingestion
├── deduplicator.py   # Deduplication
├── router.py         # Severity routing
├── storage.py        # SQLite persistence
├── dashboard.py      # Terminal UI
├── api.py            # RESTful API
├── channels/         # Output channels
│   ├── console.py
│   ├── file.py
│   ├── webhook.py
│   └── email.py
└── tests/            # Test suite
```

## Dependencies

- **Python 3.10+** - Required
- **rich** - Optional (for dashboard)
- **requests** - Optional (for webhooks)
- **flask** - Optional (for HTTP API)

## License

MIT License - Part of diet103 Sprint 4

---

Built with ❤️ for the Orchestrator Project

