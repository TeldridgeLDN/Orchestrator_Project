"""
Tests for config_manager module
"""

import pytest
from pathlib import Path
import tempfile
import json
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config_manager import (
    ConfigManager,
    GeneratorConfig,
    PathsConfig,
    TemplatesConfig,
    FormattingConfig,
    get_config,
    reload_config
)


@pytest.fixture
def temp_config():
    """Create temporary config file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        config_data = {
            "version": "1.0.0",
            "paths": {
                "skills_dir": "test/skills",
                "templates_dir": "test/templates"
            },
            "templates": {
                "default": "test-template.md.j2"
            },
            "formatting": {
                "markdown": {
                    "line_length": 100
                },
                "sections": {
                    "include_empty": True
                }
            },
            "logging": {
                "level": "DEBUG"
            }
        }
        json.dump(config_data, f)
        temp_path = Path(f.name)
    
    yield temp_path
    
    temp_path.unlink()


class TestConfigManager:
    """Test cases for ConfigManager."""
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        config = ConfigManager()
        
        assert config.config is not None
        assert isinstance(config.config, GeneratorConfig)
    
    def test_load_custom_config(self, temp_config):
        """Test loading custom configuration."""
        config = ConfigManager(temp_config)
        
        assert config.config.paths.skills_dir == "test/skills"
        assert config.config.templates.default == "test-template.md.j2"
        assert config.config.formatting.markdown.line_length == 100
    
    def test_default_values(self):
        """Test default configuration values."""
        config = ConfigManager()
        
        assert config.config.paths.skills_dir == ".claude/skills"
        assert config.config.templates.default == "skill-template.md.j2"
        assert config.config.drift_detection.enabled is True
        assert config.config.logging_config.level == "INFO"
    
    def test_get_method_simple(self, temp_config):
        """Test get method with simple key."""
        config = ConfigManager(temp_config)
        
        version = config.get('version')
        
        assert version == "1.0.0"
    
    def test_get_method_nested(self, temp_config):
        """Test get method with nested key."""
        config = ConfigManager(temp_config)
        
        skills_dir = config.get('paths.skills_dir')
        
        assert skills_dir == "test/skills"
    
    def test_get_method_default(self):
        """Test get method with default value."""
        config = ConfigManager()
        
        value = config.get('nonexistent.key', 'default_value')
        
        assert value == 'default_value'
    
    def test_set_method(self, temp_config):
        """Test set method."""
        config = ConfigManager(temp_config)
        
        config.set('paths.skills_dir', 'new/path')
        
        assert config.config.paths.skills_dir == 'new/path'
    
    def test_save_config(self, temp_config):
        """Test saving configuration."""
        config = ConfigManager(temp_config)
        
        config.set('paths.skills_dir', 'modified/path')
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            save_path = Path(f.name)
        
        try:
            config.save(save_path)
            
            # Load saved config
            with open(save_path, 'r') as f:
                data = json.load(f)
            
            assert data['paths']['skills_dir'] == 'modified/path'
        finally:
            save_path.unlink()
    
    def test_invalid_config_uses_defaults(self):
        """Test that invalid config falls back to defaults."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write('invalid json {')
            temp_path = Path(f.name)
        
        try:
            config = ConfigManager(temp_path)
            
            # Should use defaults
            assert config.config.paths.skills_dir == ".claude/skills"
        finally:
            temp_path.unlink()
    
    def test_missing_config_uses_defaults(self):
        """Test that missing config uses defaults."""
        config = ConfigManager(Path('nonexistent.json'))
        
        assert config.config.paths.skills_dir == ".claude/skills"
        assert config.config.templates.default == "skill-template.md.j2"


class TestConfigDataclasses:
    """Test configuration dataclasses."""
    
    def test_paths_config(self):
        """Test PathsConfig dataclass."""
        paths = PathsConfig(
            skills_dir="test/skills",
            templates_dir="test/templates"
        )
        
        assert paths.skills_dir == "test/skills"
        assert paths.templates_dir == "test/templates"
        assert paths.output_dir is None
    
    def test_templates_config(self):
        """Test TemplatesConfig dataclass."""
        templates = TemplatesConfig(
            default="custom.md.j2",
            custom_templates={"python": "python.md.j2"}
        )
        
        assert templates.default == "custom.md.j2"
        assert "python" in templates.custom_templates
    
    def test_generator_config_defaults(self):
        """Test GeneratorConfig with defaults."""
        config = GeneratorConfig()
        
        assert config.version == "1.0.0"
        assert config.paths.skills_dir == ".claude/skills"
        assert config.drift_detection.enabled is True


class TestGlobalConfig:
    """Test global configuration instance."""
    
    def test_get_config_singleton(self):
        """Test that get_config returns singleton."""
        config1 = get_config()
        config2 = get_config()
        
        assert config1 is config2
    
    def test_reload_config(self, temp_config):
        """Test reloading configuration."""
        # Initial config
        config1 = get_config()
        initial_path = config1.config.paths.skills_dir
        
        # Reload with custom config
        reload_config(temp_config)
        config2 = get_config()
        
        assert config2.config.paths.skills_dir == "test/skills"
        assert config2.config.paths.skills_dir != initial_path


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

