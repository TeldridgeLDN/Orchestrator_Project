"""
Tests for drift_detector module
"""

import pytest
from pathlib import Path
import tempfile
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from drift_detector import DriftDetector, DriftReport


@pytest.fixture
def temp_docs():
    """Create temporary documentation files for testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create sample existing doc
        existing = temp_path / 'existing.md'
        existing.write_text("""# Test Skill

## Overview
This is a test skill for drift detection.

## Features
- Feature 1
- Feature 2
- Feature 3

## API Reference
### Functions
- `function1()`: Does something
- `function2()`: Does another thing

## License
MIT License
""")
        
        # Create sample generated doc (with changes)
        generated = temp_path / 'generated.md'
        generated.write_text("""# Test Skill

## Overview
This is a test skill for drift detection.

## Features
- Feature 1
- Feature 2
- Feature 3
- Feature 4 (NEW)

## API Reference
### Functions
- `function1()`: Does something
- `function2()`: Does another thing
- `function3()`: Does yet another thing

## Configuration
### Settings
New section added.

## License
MIT License
""")
        
        yield existing, generated


class TestDriftDetector:
    """Test cases for DriftDetector."""
    
    def test_detector_initialization(self):
        """Test that detector initializes correctly."""
        detector = DriftDetector()
        assert detector is not None
        assert len(detector.section_markers) > 0
    
    def test_no_existing_doc(self, temp_docs):
        """Test drift detection when no existing doc exists."""
        existing, generated = temp_docs
        
        # Remove existing doc
        existing.unlink()
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert report.has_drift is True
        assert report.action == 'generate'
        assert report.reason == 'No existing documentation'
        assert report.generated_lines is not None
    
    def test_identical_docs(self, temp_docs):
        """Test drift detection when docs are identical."""
        existing, generated = temp_docs
        
        # Make them identical
        content = existing.read_text()
        generated.write_text(content)
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert report.has_drift is False
        assert report.action == 'none'
        assert report.reason == 'Documentation is up to date'
        assert report.unchanged_lines > 0
    
    def test_drift_detected(self, temp_docs):
        """Test drift detection when changes exist."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert report.has_drift is True
        assert report.action == 'update'
        assert report.reason == 'Generated documentation differs from existing'
        assert report.added_lines > 0
        assert report.section_changes is not None
    
    def test_section_change_detection(self, temp_docs):
        """Test that section-level changes are detected."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        # Should detect modified API Reference section
        assert '## API Reference' in report.section_changes
        assert report.section_changes['## API Reference'] == 'modified'
        
        # Should detect added Configuration section
        assert '## Configuration' in report.section_changes
        assert report.section_changes['## Configuration'] == 'added'
    
    def test_recommendations_generated(self, temp_docs):
        """Test that recommendations are generated."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert len(report.recommendations) > 0
        assert any('section' in rec.lower() for rec in report.recommendations)
    
    def test_diff_generation(self, temp_docs):
        """Test that unified and HTML diffs are generated."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert report.unified_diff is not None
        assert len(report.unified_diff) > 0
        assert report.html_diff is not None
        assert '<table' in report.html_diff
    
    def test_statistics_accurate(self, temp_docs):
        """Test that line statistics are accurate."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        assert report.existing_lines > 0
        assert report.generated_lines > 0
        assert report.added_lines >= 0
        assert report.removed_lines >= 0
        assert report.unchanged_lines > 0
    
    def test_skill_name_preserved(self, temp_docs):
        """Test that skill name is preserved in report."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'my-test-skill')
        
        assert report.skill_name == 'my-test-skill'
    
    def test_print_report_no_error(self, temp_docs, capsys):
        """Test that print_report doesn't error."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        # Should not raise exception
        detector.print_report(report, verbose=False)
        
        captured = capsys.readouterr()
        assert 'Drift Report' in captured.out
        assert 'test-skill' in captured.out
    
    def test_print_report_verbose(self, temp_docs, capsys):
        """Test verbose print includes diff."""
        existing, generated = temp_docs
        
        detector = DriftDetector()
        report = detector.detect(existing, generated, 'test-skill')
        
        detector.print_report(report, verbose=True)
        
        captured = capsys.readouterr()
        assert 'Unified Diff' in captured.out or 'DRIFT DETECTED' in captured.out


def test_drift_report_dataclass():
    """Test DriftReport dataclass creation."""
    report = DriftReport(
        skill_name='test',
        has_drift=True,
        reason='test reason',
        action='update'
    )
    
    assert report.skill_name == 'test'
    assert report.has_drift is True
    assert report.action == 'update'
    assert report.added_lines == 0  # default value


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

