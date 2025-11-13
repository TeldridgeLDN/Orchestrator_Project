"""
Tests for Skill Directory Scanner

Tests the directory scanning functionality with mock and real directory structures.
"""

import pytest
from pathlib import Path
import tempfile
import shutil
from scanner import SkillDirectoryScanner


class TestSkillDirectoryScanner:
    """Test suite for SkillDirectoryScanner"""
    
    @pytest.fixture
    def temp_skills_dir(self):
        """Create a temporary skills directory structure for testing"""
        temp_dir = Path(tempfile.mkdtemp())
        skills_dir = temp_dir / '.claude' / 'skills'
        skills_dir.mkdir(parents=True)
        
        # Create valid skill directories
        (skills_dir / 'skill-with-md').mkdir()
        (skills_dir / 'skill-with-md' / 'skill.md').touch()
        
        (skills_dir / 'skill-with-json').mkdir()
        (skills_dir / 'skill-with-json' / 'skill.json').touch()
        
        (skills_dir / 'skill-with-src').mkdir()
        (skills_dir / 'skill-with-src' / 'src').mkdir()
        
        (skills_dir / 'skill-with-resources').mkdir()
        (skills_dir / 'skill-with-resources' / 'resources').mkdir()
        
        (skills_dir / 'skill-with-py').mkdir()
        (skills_dir / 'skill-with-py' / 'main.py').touch()
        
        # Create invalid directories
        (skills_dir / 'not-a-skill').mkdir()
        (skills_dir / 'not-a-skill' / 'readme.txt').touch()
        
        # Create hidden directory
        (skills_dir / '.hidden-skill').mkdir()
        (skills_dir / '.hidden-skill' / 'skill.md').touch()
        
        yield skills_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def test_scanner_initialization_default(self):
        """Test scanner initializes with default base directory"""
        scanner = SkillDirectoryScanner()
        expected = Path.cwd() / '.claude' / 'skills'
        assert scanner.base_dir == expected
    
    def test_scanner_initialization_custom(self, temp_skills_dir):
        """Test scanner initializes with custom base directory"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        assert scanner.base_dir == temp_skills_dir
    
    def test_scan_finds_valid_skills(self, temp_skills_dir):
        """Test scanner finds all valid skill directories"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan()
        
        skill_names = [s.name for s in skills]
        
        assert 'skill-with-md' in skill_names
        assert 'skill-with-json' in skill_names
        assert 'skill-with-src' in skill_names
        assert 'skill-with-resources' in skill_names
        assert 'skill-with-py' in skill_names
        assert 'not-a-skill' not in skill_names
    
    def test_scan_excludes_hidden_by_default(self, temp_skills_dir):
        """Test scanner excludes hidden directories by default"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan()
        
        skill_names = [s.name for s in skills]
        assert '.hidden-skill' not in skill_names
    
    def test_scan_includes_hidden_when_requested(self, temp_skills_dir):
        """Test scanner includes hidden directories when requested"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan(include_hidden=True)
        
        skill_names = [s.name for s in skills]
        assert '.hidden-skill' in skill_names
    
    def test_scan_with_exclude_patterns(self, temp_skills_dir):
        """Test scanner excludes directories matching patterns"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan(exclude_patterns=['with-md', 'with-json'])
        
        skill_names = [s.name for s in skills]
        
        assert 'skill-with-md' not in skill_names
        assert 'skill-with-json' not in skill_names
        assert 'skill-with-src' in skill_names
    
    def test_is_skill_directory_with_skill_md(self, temp_skills_dir):
        """Test skill detection with skill.md file"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-md'
        assert scanner._is_skill_directory(skill_path) is True
    
    def test_is_skill_directory_with_skill_json(self, temp_skills_dir):
        """Test skill detection with skill.json file"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-json'
        assert scanner._is_skill_directory(skill_path) is True
    
    def test_is_skill_directory_with_src(self, temp_skills_dir):
        """Test skill detection with src/ directory"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-src'
        assert scanner._is_skill_directory(skill_path) is True
    
    def test_is_skill_directory_with_resources(self, temp_skills_dir):
        """Test skill detection with resources/ directory"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-resources'
        assert scanner._is_skill_directory(skill_path) is True
    
    def test_is_skill_directory_with_py_files(self, temp_skills_dir):
        """Test skill detection with Python files"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-py'
        assert scanner._is_skill_directory(skill_path) is True
    
    def test_is_skill_directory_invalid(self, temp_skills_dir):
        """Test skill detection with invalid directory"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'not-a-skill'
        assert scanner._is_skill_directory(skill_path) is False
    
    def test_get_skill_info(self, temp_skills_dir):
        """Test extraction of skill information"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skill_path = temp_skills_dir / 'skill-with-md'
        info = scanner.get_skill_info(skill_path)
        
        assert info['name'] == 'skill-with-md'
        assert info['path'] == skill_path
        assert info['has_skill_md'] is True
        assert info['has_skill_json'] is False
        assert info['has_src'] is False
        assert info['has_resources'] is False
    
    def test_scan_with_info(self, temp_skills_dir):
        """Test scanning with detailed info returns correct data"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan_with_info()
        
        assert len(skills) == 5  # Excluding 'not-a-skill' and '.hidden-skill'
        assert all('name' in skill for skill in skills)
        assert all('path' in skill for skill in skills)
        assert all('has_skill_md' in skill for skill in skills)
    
    def test_scan_nonexistent_directory(self):
        """Test scanner handles nonexistent directory gracefully"""
        nonexistent = Path('/nonexistent/directory')
        scanner = SkillDirectoryScanner(nonexistent)
        skills = scanner.scan()
        
        assert skills == []
    
    def test_scan_returns_sorted_results(self, temp_skills_dir):
        """Test that scan results are sorted alphabetically"""
        scanner = SkillDirectoryScanner(temp_skills_dir)
        skills = scanner.scan()
        
        skill_names = [s.name for s in skills]
        assert skill_names == sorted(skill_names)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

