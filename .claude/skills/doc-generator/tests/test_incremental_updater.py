"""
Tests for incremental_updater module
"""

import pytest
from pathlib import Path
import tempfile
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from incremental_updater import IncrementalUpdater, MergeResult, MANUAL_EDIT_START, MANUAL_EDIT_END, AUTO_GENERATED_MARKER


@pytest.fixture
def temp_docs():
    """Create temporary documentation files for testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create sample existing doc with manual edits
        existing = temp_path / 'existing.md'
        existing.write_text(f"""# Test Skill

**Version**: 1.0.0

## Overview
This is a test skill.

## Features
- Feature 1
- Feature 2

{MANUAL_EDIT_START}
## Custom Section
This is manually added content that should be preserved.
{MANUAL_EDIT_END}

## API Reference
### Functions
- `old_function()`: Old function

{AUTO_GENERATED_MARKER}
## Configuration
This section is auto-generated and can be replaced.

## License
MIT License
""")
        
        # Create sample generated doc (with updates)
        generated = temp_path / 'generated.md'
        generated.write_text("""# Test Skill

**Version**: 2.0.0

## Overview
This is an updated test skill.

## Features
- Feature 1
- Feature 2
- Feature 3 (NEW)

## API Reference
### Functions
- `old_function()`: Old function (updated docs)
- `new_function()`: New function

## Configuration
Updated configuration section.

## Testing
New testing section.

## License
MIT License
""")
        
        yield existing, generated


class TestIncrementalUpdater:
    """Test cases for IncrementalUpdater."""
    
    def test_updater_initialization(self):
        """Test that updater initializes correctly."""
        updater = IncrementalUpdater()
        assert updater is not None
        assert len(updater.section_markers) > 0
    
    def test_no_existing_doc(self, temp_docs):
        """Test merge when no existing doc exists."""
        existing, generated = temp_docs
        
        # Remove existing doc
        existing.unlink()
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True)
        
        assert result.success is True
        assert result.sections_updated > 0
        assert 'No existing documentation' in result.info[0]
        assert result.merged_content == generated.read_text()
    
    def test_preserve_manual_zones(self, temp_docs):
        """Test that manual edit zones are preserved."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=True)
        
        assert result.success is True
        # Manual Custom Section should be preserved
        assert MANUAL_EDIT_START in result.merged_content
        assert 'Custom Section' in result.merged_content
        assert 'manually added content' in result.merged_content
    
    def test_replace_auto_generated(self, temp_docs):
        """Test that auto-generated sections can be replaced."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=False)
        
        assert result.success is True
        # When preserve_all_manual=False, Configuration section should be updated
        assert 'Updated configuration section' in result.merged_content
    
    def test_preserve_all_manual_by_default(self, temp_docs):
        """Test that existing sections are preserved by default."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=True)
        
        assert result.success is True
        # Overview should be preserved (not marked as auto-generated)
        assert 'This is a test skill' in result.merged_content
        # Should NOT be updated to "updated test skill"
    
    def test_replace_all_mode(self, temp_docs):
        """Test replace_all mode (no preservation except manual zones)."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=False)
        
        assert result.success is True
        # Configuration should be replaced (not in manual zone)
        assert 'Updated configuration section' in result.merged_content
        # Manual zones should still be preserved
        assert 'Custom Section' in result.merged_content
    
    def test_statistics_accurate(self, temp_docs):
        """Test that merge statistics are accurate."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=True)
        
        assert result.sections_updated >= 0
        assert result.sections_preserved >= 0
        assert result.sections_updated + result.sections_preserved > 0
    
    def test_backup_created(self, temp_docs):
        """Test that backup is created when not dry-run."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=False)
        
        assert result.success is True
        # Check for backup file
        backup_path = existing.with_suffix('.md.bak')
        assert backup_path.exists()
    
    def test_dry_run_no_write(self, temp_docs):
        """Test that dry-run doesn't modify files."""
        existing, generated = temp_docs
        
        original_content = existing.read_text()
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True)
        
        assert result.success is True
        # File should be unchanged
        assert existing.read_text() == original_content
    
    def test_skill_name_preserved(self, temp_docs):
        """Test that skill name is preserved in result."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, skill_name='my-test-skill', dry_run=True)
        
        assert result.skill_name == 'my-test-skill'
    
    def test_section_detection(self, temp_docs):
        """Test section parsing."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        
        existing_content = existing.read_text()
        sections = updater._parse_sections(existing_content)
        
        # Standard sections should be detected
        assert '## Overview' in sections
        assert '## API Reference' in sections
        assert '## Configuration' in sections
        assert len(sections) > 0
        # Note: ## Features is not in section_markers, so it's part of Overview
    
    def test_manual_zone_detection(self, temp_docs):
        """Test manual edit zone detection."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        
        existing_content = existing.read_text()
        zones = updater._detect_manual_zones(existing_content)
        
        assert len(zones) > 0
        assert all(isinstance(zone, tuple) and len(zone) == 2 for zone in zones)
    
    def test_header_always_updated(self, temp_docs):
        """Test that header (title, version) is always from generated."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=True)
        
        assert result.success is True
        # Version should be updated to 2.0.0 from generated
        assert '2.0.0' in result.merged_content
        # Old version should not be present
        assert result.merged_content.count('1.0.0') == 0
    
    def test_new_sections_added(self, temp_docs):
        """Test that new sections from generated are added."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True, preserve_all_manual=False)
        
        assert result.success is True
        # Testing section should be added
        assert '## Testing' in result.merged_content
        assert 'New testing section' in result.merged_content
    
    def test_print_result_no_error(self, temp_docs, capsys):
        """Test that print_result doesn't error."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True)
        
        # Should not raise exception
        updater.print_result(result, verbose=False)
        
        captured = capsys.readouterr()
        assert 'Merge Result' in captured.out
    
    def test_print_result_verbose(self, temp_docs, capsys):
        """Test verbose print includes details."""
        existing, generated = temp_docs
        
        updater = IncrementalUpdater()
        result = updater.merge(existing, generated, dry_run=True)
        
        updater.print_result(result, verbose=True)
        
        captured = capsys.readouterr()
        assert 'Statistics' in captured.out


def test_merge_result_dataclass():
    """Test MergeResult dataclass creation."""
    result = MergeResult(
        skill_name='test',
        success=True,
        merged_content='# Test'
    )
    
    assert result.skill_name == 'test'
    assert result.success is True
    assert result.merged_content == '# Test'
    assert result.sections_updated == 0  # default value


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

