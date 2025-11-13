"""
Configuration Manager

Manages configuration for the documentation generator.
Loads settings from JSON file and provides typed access.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class PathsConfig:
    """Configuration for paths."""
    skills_dir: str = ".claude/skills"
    templates_dir: str = "templates"
    output_dir: Optional[str] = None
    reports_dir: str = ".taskmaster/reports"


@dataclass
class TemplatesConfig:
    """Configuration for templates."""
    default: str = "skill-template.md.j2"
    custom_templates: Dict[str, str] = field(default_factory=dict)


@dataclass
class MarkdownFormattingConfig:
    """Configuration for Markdown formatting."""
    line_length: int = 120
    list_indent: int = 2
    code_fence: str = "```"
    heading_style: str = "atx"


@dataclass
class SectionsConfig:
    """Configuration for documentation sections."""
    include_empty: bool = False
    preserve_order: bool = True
    standard_order: List[str] = field(default_factory=lambda: [
        "Overview", "Capabilities", "Dependencies", "Configuration",
        "File Structure", "API Reference", "Usage", "Testing",
        "Documentation", "License"
    ])


@dataclass
class FormattingConfig:
    """Configuration for formatting."""
    markdown: MarkdownFormattingConfig = field(default_factory=MarkdownFormattingConfig)
    sections: SectionsConfig = field(default_factory=SectionsConfig)


@dataclass
class ParsingConfig:
    """Configuration for code parsing."""
    python: Dict[str, Any] = field(default_factory=lambda: {
        "enabled": True,
        "include_private": False,
        "include_dunder": False,
        "max_depth": 10
    })
    typescript: Dict[str, Any] = field(default_factory=lambda: {
        "enabled": True,
        "include_private": False,
        "parse_mode": "auto"
    })
    javascript: Dict[str, Any] = field(default_factory=lambda: {
        "enabled": True,
        "include_private": False,
        "parse_mode": "auto"
    })


@dataclass
class DriftDetectionConfig:
    """Configuration for drift detection."""
    enabled: bool = True
    threshold: str = "minor"
    auto_backup: bool = True
    backup_suffix: str = ".bak"


@dataclass
class IncrementalUpdatesConfig:
    """Configuration for incremental updates."""
    enabled: bool = True
    preserve_manual_edits: bool = True
    manual_edit_markers: Dict[str, str] = field(default_factory=lambda: {
        "start": "<!-- MANUAL EDIT START -->",
        "end": "<!-- MANUAL EDIT END -->"
    })
    auto_generated_marker: str = "<!-- AUTO-GENERATED: DO NOT EDIT -->"


@dataclass
class LoggingConfig:
    """Configuration for logging."""
    level: str = "INFO"
    format: str = "%(levelname)s: %(message)s"
    file: Optional[str] = None


@dataclass
class PerformanceConfig:
    """Configuration for performance."""
    max_file_size_mb: int = 10
    timeout_seconds: int = 30
    parallel_parsing: bool = False


@dataclass
class GeneratorConfig:
    """Complete configuration for the documentation generator."""
    version: str = "1.0.0"
    paths: PathsConfig = field(default_factory=PathsConfig)
    templates: TemplatesConfig = field(default_factory=TemplatesConfig)
    formatting: FormattingConfig = field(default_factory=FormattingConfig)
    parsing: ParsingConfig = field(default_factory=ParsingConfig)
    drift_detection: DriftDetectionConfig = field(default_factory=DriftDetectionConfig)
    incremental_updates: IncrementalUpdatesConfig = field(default_factory=IncrementalUpdatesConfig)
    logging_config: LoggingConfig = field(default_factory=LoggingConfig)
    performance: PerformanceConfig = field(default_factory=PerformanceConfig)


class ConfigManager:
    """
    Manages configuration for the documentation generator.
    
    Features:
    - Load from JSON file
    - Typed access to settings
    - Default values
    - Validation
    - Save modifications
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize configuration manager.
        
        Args:
            config_path: Path to config.json (defaults to ./config.json)
        """
        if config_path is None:
            self.config_path = Path(__file__).parent / "config.json"
        else:
            self.config_path = Path(config_path)
        
        self.config: GeneratorConfig = self._load_config()
    
    def _load_config(self) -> GeneratorConfig:
        """Load configuration from file or use defaults."""
        if not self.config_path.exists():
            logger.warning(f"Config file not found: {self.config_path}, using defaults")
            return GeneratorConfig()
        
        try:
            with open(self.config_path, 'r') as f:
                data = json.load(f)
            
            # Parse nested structures
            config = GeneratorConfig(
                version=data.get('version', '1.0.0'),
                paths=self._parse_paths(data.get('paths', {})),
                templates=self._parse_templates(data.get('templates', {})),
                formatting=self._parse_formatting(data.get('formatting', {})),
                parsing=self._parse_parsing(data.get('parsing', {})),
                drift_detection=self._parse_drift_detection(data.get('drift_detection', {})),
                incremental_updates=self._parse_incremental_updates(data.get('incremental_updates', {})),
                logging_config=self._parse_logging(data.get('logging', {})),
                performance=self._parse_performance(data.get('performance', {}))
            )
            
            logger.info(f"Loaded configuration from {self.config_path}")
            return config
        
        except Exception as e:
            logger.error(f"Error loading config: {e}, using defaults")
            return GeneratorConfig()
    
    def _parse_paths(self, data: Dict) -> PathsConfig:
        """Parse paths configuration."""
        return PathsConfig(
            skills_dir=data.get('skills_dir', '.claude/skills'),
            templates_dir=data.get('templates_dir', 'templates'),
            output_dir=data.get('output_dir'),
            reports_dir=data.get('reports_dir', '.taskmaster/reports')
        )
    
    def _parse_templates(self, data: Dict) -> TemplatesConfig:
        """Parse templates configuration."""
        return TemplatesConfig(
            default=data.get('default', 'skill-template.md.j2'),
            custom_templates=data.get('custom_templates', {})
        )
    
    def _parse_formatting(self, data: Dict) -> FormattingConfig:
        """Parse formatting configuration."""
        markdown_data = data.get('markdown', {})
        sections_data = data.get('sections', {})
        
        return FormattingConfig(
            markdown=MarkdownFormattingConfig(
                line_length=markdown_data.get('line_length', 120),
                list_indent=markdown_data.get('list_indent', 2),
                code_fence=markdown_data.get('code_fence', '```'),
                heading_style=markdown_data.get('heading_style', 'atx')
            ),
            sections=SectionsConfig(
                include_empty=sections_data.get('include_empty', False),
                preserve_order=sections_data.get('preserve_order', True),
                standard_order=sections_data.get('standard_order', [
                    "Overview", "Capabilities", "Dependencies", "Configuration",
                    "File Structure", "API Reference", "Usage", "Testing",
                    "Documentation", "License"
                ])
            )
        )
    
    def _parse_parsing(self, data: Dict) -> ParsingConfig:
        """Parse parsing configuration."""
        return ParsingConfig(
            python=data.get('python', {
                "enabled": True,
                "include_private": False,
                "include_dunder": False,
                "max_depth": 10
            }),
            typescript=data.get('typescript', {
                "enabled": True,
                "include_private": False,
                "parse_mode": "auto"
            }),
            javascript=data.get('javascript', {
                "enabled": True,
                "include_private": False,
                "parse_mode": "auto"
            })
        )
    
    def _parse_drift_detection(self, data: Dict) -> DriftDetectionConfig:
        """Parse drift detection configuration."""
        return DriftDetectionConfig(
            enabled=data.get('enabled', True),
            threshold=data.get('threshold', 'minor'),
            auto_backup=data.get('auto_backup', True),
            backup_suffix=data.get('backup_suffix', '.bak')
        )
    
    def _parse_incremental_updates(self, data: Dict) -> IncrementalUpdatesConfig:
        """Parse incremental updates configuration."""
        return IncrementalUpdatesConfig(
            enabled=data.get('enabled', True),
            preserve_manual_edits=data.get('preserve_manual_edits', True),
            manual_edit_markers=data.get('manual_edit_markers', {
                "start": "<!-- MANUAL EDIT START -->",
                "end": "<!-- MANUAL EDIT END -->"
            }),
            auto_generated_marker=data.get('auto_generated_marker', '<!-- AUTO-GENERATED: DO NOT EDIT -->')
        )
    
    def _parse_logging(self, data: Dict) -> LoggingConfig:
        """Parse logging configuration."""
        return LoggingConfig(
            level=data.get('level', 'INFO'),
            format=data.get('format', '%(levelname)s: %(message)s'),
            file=data.get('file')
        )
    
    def _parse_performance(self, data: Dict) -> PerformanceConfig:
        """Parse performance configuration."""
        return PerformanceConfig(
            max_file_size_mb=data.get('max_file_size_mb', 10),
            timeout_seconds=data.get('timeout_seconds', 30),
            parallel_parsing=data.get('parallel_parsing', False)
        )
    
    def save(self, config_path: Optional[Path] = None):
        """
        Save configuration to file.
        
        Args:
            config_path: Path to save to (defaults to current config_path)
        """
        save_path = Path(config_path) if config_path else self.config_path
        
        data = {
            "version": self.config.version,
            "generator": {
                "name": "Skill Documentation Generator",
                "description": "Automated documentation generator for Claude Code skills"
            },
            "paths": {
                "skills_dir": self.config.paths.skills_dir,
                "templates_dir": self.config.paths.templates_dir,
                "output_dir": self.config.paths.output_dir,
                "reports_dir": self.config.paths.reports_dir
            },
            "templates": {
                "default": self.config.templates.default,
                "custom_templates": self.config.templates.custom_templates
            },
            "formatting": {
                "markdown": {
                    "line_length": self.config.formatting.markdown.line_length,
                    "list_indent": self.config.formatting.markdown.list_indent,
                    "code_fence": self.config.formatting.markdown.code_fence,
                    "heading_style": self.config.formatting.markdown.heading_style
                },
                "sections": {
                    "include_empty": self.config.formatting.sections.include_empty,
                    "preserve_order": self.config.formatting.sections.preserve_order,
                    "standard_order": self.config.formatting.sections.standard_order
                }
            },
            "parsing": {
                "python": self.config.parsing.python,
                "typescript": self.config.parsing.typescript,
                "javascript": self.config.parsing.javascript
            },
            "drift_detection": {
                "enabled": self.config.drift_detection.enabled,
                "threshold": self.config.drift_detection.threshold,
                "auto_backup": self.config.drift_detection.auto_backup,
                "backup_suffix": self.config.drift_detection.backup_suffix
            },
            "incremental_updates": {
                "enabled": self.config.incremental_updates.enabled,
                "preserve_manual_edits": self.config.incremental_updates.preserve_manual_edits,
                "manual_edit_markers": self.config.incremental_updates.manual_edit_markers,
                "auto_generated_marker": self.config.incremental_updates.auto_generated_marker
            },
            "logging": {
                "level": self.config.logging_config.level,
                "format": self.config.logging_config.format,
                "file": self.config.logging_config.file
            },
            "performance": {
                "max_file_size_mb": self.config.performance.max_file_size_mb,
                "timeout_seconds": self.config.performance.timeout_seconds,
                "parallel_parsing": self.config.performance.parallel_parsing
            }
        }
        
        with open(save_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved configuration to {save_path}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value by dot-notation key.
        
        Args:
            key: Key in dot notation (e.g., 'paths.skills_dir')
            default: Default value if key not found
        
        Returns:
            Configuration value
        """
        parts = key.split('.')
        value = self.config
        
        for part in parts:
            if hasattr(value, part):
                value = getattr(value, part)
            elif isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """
        Set configuration value by dot-notation key.
        
        Args:
            key: Key in dot notation
            value: Value to set
        """
        parts = key.split('.')
        obj = self.config
        
        for part in parts[:-1]:
            if hasattr(obj, part):
                obj = getattr(obj, part)
            else:
                raise KeyError(f"Invalid config key: {key}")
        
        if hasattr(obj, parts[-1]):
            setattr(obj, parts[-1], value)
        else:
            raise KeyError(f"Invalid config key: {key}")


# Global configuration instance
_global_config = None


def get_config(config_path: Optional[Path] = None) -> ConfigManager:
    """
    Get the global configuration instance.
    
    Args:
        config_path: Path to config file (only used on first call)
    
    Returns:
        ConfigManager instance
    """
    global _global_config
    if _global_config is None:
        _global_config = ConfigManager(config_path)
    return _global_config


def reload_config(config_path: Optional[Path] = None):
    """
    Reload configuration from file.
    
    Args:
        config_path: Path to config file
    """
    global _global_config
    _global_config = ConfigManager(config_path)

