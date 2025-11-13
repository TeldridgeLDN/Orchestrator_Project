"""
Tests for Metadata Extractor

Tests the metadata extraction functionality for YAML, JSON, and Python docstrings.
"""

import pytest
from pathlib import Path
import tempfile
import shutil
import json
import yaml
from metadata_extractor import MetadataExtractor


class TestMetadataExtractor:
    """Test suite for MetadataExtractor"""
    
    @pytest.fixture
    def temp_skill_dir(self):
        """Create a temporary skill directory with sample files"""
        temp_dir = Path(tempfile.mkdtemp())
        
        # Create skill.json
        skill_json = {
            'name': 'test-skill',
            'version': '1.0.0',
            'description': 'A test skill',
            'author': 'Test Author',
            'keywords': ['test', 'sample']
        }
        with open(temp_dir / 'skill.json', 'w') as f:
            json.dump(skill_json, f)
        
        # Create a Python file with docstrings
        python_code = '''"""
Test Module

This is a test module for metadata extraction.
"""

def test_function(arg1, arg2):
    """
    A test function.
    
    Args:
        arg1: First argument
        arg2: Second argument
    """
    pass

class TestClass:
    """A test class."""
    
    def test_method(self, x):
        """Test method."""
        return x * 2
'''
        with open(temp_dir / 'test_module.py', 'w') as f:
            f.write(python_code)
        
        yield temp_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def temp_yaml_skill(self):
        """Create a temporary skill with YAML config"""
        temp_dir = Path(tempfile.mkdtemp())
        
        skill_yaml = {
            'name': 'yaml-skill',
            'version': '2.0.0',
            'capabilities': ['parsing', 'validation']
        }
        with open(temp_dir / 'skill.yaml', 'w') as f:
            yaml.dump(skill_yaml, f)
        
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_extractor_initialization(self):
        """Test extractor initializes correctly"""
        extractor = MetadataExtractor()
        assert extractor.supported_config_files is not None
        assert 'skill.json' in extractor.supported_config_files
        assert 'skill.yaml' in extractor.supported_config_files
    
    def test_extract_json(self, temp_skill_dir):
        """Test JSON extraction"""
        extractor = MetadataExtractor()
        json_path = temp_skill_dir / 'skill.json'
        data = extractor.extract_json(json_path)
        
        assert data['name'] == 'test-skill'
        assert data['version'] == '1.0.0'
        assert data['description'] == 'A test skill'
        assert 'test' in data['keywords']
    
    def test_extract_yaml(self, temp_yaml_skill):
        """Test YAML extraction"""
        extractor = MetadataExtractor()
        yaml_path = temp_yaml_skill / 'skill.yaml'
        data = extractor.extract_yaml(yaml_path)
        
        assert data['name'] == 'yaml-skill'
        assert data['version'] == '2.0.0'
        assert 'parsing' in data['capabilities']
    
    def test_extract_config_finds_json(self, temp_skill_dir):
        """Test config extraction finds JSON file"""
        extractor = MetadataExtractor()
        config = extractor.extract_config(temp_skill_dir)
        
        assert config is not None
        assert config['name'] == 'test-skill'
    
    def test_extract_config_finds_yaml(self, temp_yaml_skill):
        """Test config extraction finds YAML file"""
        extractor = MetadataExtractor()
        config = extractor.extract_config(temp_yaml_skill)
        
        assert config is not None
        assert config['name'] == 'yaml-skill'
    
    def test_extract_python_docstrings(self, temp_skill_dir):
        """Test Python docstring extraction"""
        extractor = MetadataExtractor()
        py_file = temp_skill_dir / 'test_module.py'
        data = extractor.extract_python_docstrings(py_file)
        
        assert data['file'] == 'test_module.py'
        assert 'Test Module' in data['module_docstring']
        assert len(data['functions']) == 1
        assert data['functions'][0]['name'] == 'test_function'
        assert len(data['functions'][0]['args']) == 2
        assert len(data['classes']) == 1
        assert data['classes'][0]['name'] == 'TestClass'
        assert len(data['classes'][0]['methods']) == 1
    
    def test_extract_python_modules(self, temp_skill_dir):
        """Test extraction of all Python modules"""
        extractor = MetadataExtractor()
        modules = extractor.extract_python_modules(temp_skill_dir)
        
        assert len(modules) == 1
        assert modules[0]['file'] == 'test_module.py'
    
    def test_extract_from_skill_directory(self, temp_skill_dir):
        """Test complete extraction from skill directory"""
        extractor = MetadataExtractor()
        metadata = extractor.extract_from_skill_directory(temp_skill_dir)
        
        assert metadata['name'] == temp_skill_dir.name
        assert metadata['has_config'] is True
        assert metadata['has_python'] is True
        assert metadata['config']['name'] == 'test-skill'
        assert len(metadata['python_modules']) == 1
    
    def test_normalize_metadata(self, temp_skill_dir):
        """Test metadata normalization"""
        extractor = MetadataExtractor()
        raw_metadata = extractor.extract_from_skill_directory(temp_skill_dir)
        
        # Add config data to raw metadata for normalization
        raw_metadata.update(raw_metadata['config'])
        
        normalized = extractor.normalize_metadata(raw_metadata)
        
        assert 'name' in normalized
        assert 'version' in normalized
        assert 'description' in normalized
        assert normalized['name'] == 'test-skill'
        assert normalized['version'] == '1.0.0'
    
    def test_extract_empty_json(self):
        """Test handling of empty JSON file"""
        temp_dir = Path(tempfile.mkdtemp())
        empty_json = temp_dir / 'empty.json'
        
        with open(empty_json, 'w') as f:
            f.write('{}')
        
        extractor = MetadataExtractor()
        data = extractor.extract_json(empty_json)
        
        assert data == {}
        shutil.rmtree(temp_dir)
    
    def test_extract_invalid_json(self):
        """Test handling of invalid JSON"""
        temp_dir = Path(tempfile.mkdtemp())
        invalid_json = temp_dir / 'invalid.json'
        
        with open(invalid_json, 'w') as f:
            f.write('{ invalid json }')
        
        extractor = MetadataExtractor()
        data = extractor.extract_json(invalid_json)
        
        assert data == {}
        shutil.rmtree(temp_dir)
    
    def test_extract_invalid_python(self):
        """Test handling of invalid Python syntax"""
        temp_dir = Path(tempfile.mkdtemp())
        invalid_py = temp_dir / 'invalid.py'
        
        with open(invalid_py, 'w') as f:
            f.write('def broken(:\n    pass')
        
        extractor = MetadataExtractor()
        data = extractor.extract_python_docstrings(invalid_py)
        
        assert data == {}
        shutil.rmtree(temp_dir)
    
    def test_extract_nonexistent_file(self):
        """Test handling of nonexistent file"""
        extractor = MetadataExtractor()
        data = extractor.extract_json(Path('/nonexistent/file.json'))
        
        assert data == {}


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

