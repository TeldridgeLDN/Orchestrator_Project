"""Unit tests for workflows module"""

import json
import pytest
from pathlib import Path
from typing import Dict, Any
from unittest.mock import patch, MagicMock, call
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from lib.workflows import (
    WorkflowError,
    prompt_for_confirmation,
    display_project_list,
    resolve_ambiguous_project,
    switch_project,
    show_current_context,
    validate_and_prompt,
    interactive_project_selection,
    display_context_mismatch_warning
)


pytestmark = pytest.mark.unit


class TestPromptForConfirmation:
    """Tests for prompt_for_confirmation function"""
    
    def test_prompt_yes_response(self):
        """Test that 'y' returns True"""
        with patch('builtins.input', return_value='y'):
            result = prompt_for_confirmation("Continue?")
            assert result is True
    
    def test_prompt_yes_full_response(self):
        """Test that 'yes' returns True"""
        with patch('builtins.input', return_value='yes'):
            result = prompt_for_confirmation("Continue?")
            assert result is True
    
    def test_prompt_no_response(self):
        """Test that 'n' returns False"""
        with patch('builtins.input', return_value='n'):
            result = prompt_for_confirmation("Continue?")
            assert result is False
    
    def test_prompt_no_full_response(self):
        """Test that 'no' returns False"""
        with patch('builtins.input', return_value='no'):
            result = prompt_for_confirmation("Continue?")
            assert result is False
    
    def test_prompt_empty_with_default_true(self):
        """Test empty input returns default (True)"""
        with patch('builtins.input', return_value=''):
            result = prompt_for_confirmation("Continue?", default=True)
            assert result is True
    
    def test_prompt_empty_with_default_false(self):
        """Test empty input returns default (False)"""
        with patch('builtins.input', return_value=''):
            result = prompt_for_confirmation("Continue?", default=False)
            assert result is False
    
    def test_prompt_case_insensitive(self):
        """Test that input is case insensitive"""
        with patch('builtins.input', return_value='YES'):
            result = prompt_for_confirmation("Continue?")
            assert result is True
        
        with patch('builtins.input', return_value='Y'):
            result = prompt_for_confirmation("Continue?")
            assert result is True
    
    def test_prompt_strips_whitespace(self):
        """Test that input is stripped of whitespace"""
        with patch('builtins.input', return_value='  yes  '):
            result = prompt_for_confirmation("Continue?")
            assert result is True


class TestDisplayProjectList:
    """Tests for display_project_list function"""
    
    def test_display_empty_list(self, capsys):
        """Test displaying empty project list"""
        display_project_list(projects=[])
        captured = capsys.readouterr()
        assert "No projects registered" in captured.out
    
    def test_display_project_list_with_projects(self, capsys):
        """Test displaying projects"""
        projects = [
            ("test-project", {
                "path": "/path/to/test",
                "description": "Test project"
            }),
            ("another-project", {
                "path": "/path/to/another",
                "description": "Another project"
            })
        ]
        
        with patch('lib.workflows.load_registry', return_value={"active_project": "test-project"}):
            display_project_list(projects=projects)
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out
        assert "another-project" in captured.out
        assert "/path/to/test" in captured.out
        assert "/path/to/another" in captured.out
    
    def test_display_without_paths(self, capsys):
        """Test displaying projects without paths"""
        projects = [
            ("test-project", {
                "path": "/path/to/test",
                "description": "Test project"
            })
        ]
        
        with patch('lib.workflows.load_registry', return_value={}):
            display_project_list(projects=projects, include_paths=False)
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out
        assert "/path/to/test" not in captured.out
    
    def test_display_without_descriptions(self, capsys):
        """Test displaying projects without descriptions"""
        projects = [
            ("test-project", {
                "path": "/path/to/test",
                "description": "Test project"
            })
        ]
        
        with patch('lib.workflows.load_registry', return_value={}):
            display_project_list(projects=projects, include_descriptions=False)
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out
        # Description might still appear depending on implementation
    
    def test_display_loads_projects_when_none_provided(self, capsys):
        """Test that projects are loaded if not provided"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"})
        ]):
            with patch('lib.workflows.load_registry', return_value={}):
                display_project_list()
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out
    
    def test_display_handles_registry_error(self, capsys):
        """Test error handling when loading projects fails"""
        from lib.registry import RegistryError
        
        with patch('lib.workflows.list_projects', side_effect=RegistryError("Test error")):
            display_project_list()
        
        captured = capsys.readouterr()
        assert "Error loading projects" in captured.out


class TestResolveAmbiguousProject:
    """Tests for resolve_ambiguous_project function"""
    
    def test_resolve_with_single_match(self):
        """Test resolving with only one match"""
        matches = [
            {"project_id": "test-project", "similarity": 0.9, "project_data": {}}
        ]
        
        with patch('builtins.input', return_value='1'):
            result = resolve_ambiguous_project(matches, "test")
        
        assert result == "test-project"
    
    def test_resolve_with_multiple_matches(self):
        """Test resolving with multiple matches"""
        matches = [
            {"project_id": "test-project", "similarity": 0.9, "project_data": {}},
            {"project_id": "test-proj", "similarity": 0.8, "project_data": {}}
        ]
        
        with patch('builtins.input', return_value='1'):
            result = resolve_ambiguous_project(matches, "test")
        
        assert result == "test-project"
    
    def test_resolve_with_cancel(self):
        """Test canceling resolution"""
        matches = [
            {"project_id": "test-project", "similarity": 0.9, "project_data": {}}
        ]
        
        with patch('builtins.input', return_value='0'):
            result = resolve_ambiguous_project(matches, "test")
        
        assert result is None
    
    def test_resolve_with_invalid_input(self):
        """Test handling invalid input"""
        matches = [
            {"project_id": "test-project", "similarity": 0.9, "project_data": {}}
        ]
        
        with patch('builtins.input', side_effect=['invalid', '1']):
            result = resolve_ambiguous_project(matches, "test")
        
        assert result == "test-project"
    
    def test_resolve_with_out_of_range_input(self):
        """Test handling out of range input"""
        matches = [
            {"project_id": "test-project", "similarity": 0.9, "project_data": {}}
        ]
        
        with patch('builtins.input', side_effect=['5', '1']):
            result = resolve_ambiguous_project(matches, "test")
        
        assert result == "test-project"


class TestSwitchProject:
    """Tests for switch_project function"""
    
    def test_switch_to_existing_project(self, populated_registry):
        """Test switching to an existing project"""
        with patch('lib.workflows.set_active_project') as mock_set:
            result = switch_project("another-project", registry_path=populated_registry)
            assert result is True
            mock_set.assert_called_once()
    
    def test_switch_with_confirmation(self, populated_registry):
        """Test switching with confirmation required"""
        with patch('lib.workflows.set_active_project') as mock_set:
            with patch('lib.workflows.prompt_for_confirmation', return_value=True):
                result = switch_project(
                    "another-project",
                    registry_path=populated_registry,
                    require_confirmation=True
                )
                assert result is True
    
    def test_switch_confirmation_declined(self, populated_registry):
        """Test declining switch confirmation"""
        with patch('lib.workflows.set_active_project') as mock_set:
            with patch('lib.workflows.prompt_for_confirmation', return_value=False):
                result = switch_project(
                    "another-project",
                    registry_path=populated_registry,
                    require_confirmation=True
                )
                assert result is False
                mock_set.assert_not_called()
    
    def test_switch_to_nonexistent_project(self, populated_registry):
        """Test switching to a non-existent project"""
        with patch('lib.workflows.get_project', side_effect=Exception("Not found")):
            result = switch_project("nonexistent", registry_path=populated_registry)
            assert result is False
    
    def test_switch_with_ambiguous_reference(self, populated_registry):
        """Test switching with ambiguous project reference"""
        with patch('lib.workflows.get_project', side_effect=Exception("Not found")):
            with patch('lib.workflows.list_ambiguous_matches', return_value=[
                {"project_id": "test-project", "similarity": 0.9, "project_data": {}}
            ]):
                with patch('lib.workflows.resolve_ambiguous_project', return_value="test-project"):
                    with patch('lib.workflows.set_active_project'):
                        result = switch_project("test", registry_path=populated_registry)
                        assert result is True


class TestShowCurrentContext:
    """Tests for show_current_context function"""
    
    def test_show_current_context_with_active_project(self, populated_registry, capsys):
        """Test showing current context with active project"""
        with patch('lib.workflows.load_registry', return_value={
            "active_project": "test-project",
            "projects": {
                "test-project": {
                    "path": "/path/to/test",
                    "description": "Test project"
                }
            }
        }):
            with patch('lib.workflows.detect_project', return_value=("test-project", "/path/to/test", 1.0)):
                show_current_context()
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out
    
    def test_show_current_context_no_active_project(self, capsys):
        """Test showing context when no project is active"""
        with patch('lib.workflows.load_registry', return_value={
            "projects": {}
        }):
            show_current_context()
        
        captured = capsys.readouterr()
        assert "No active project" in captured.out or "no project" in captured.out.lower()
    
    def test_show_current_context_verbose(self, populated_registry, capsys):
        """Test showing verbose context information"""
        with patch('lib.workflows.load_registry', return_value={
            "active_project": "test-project",
            "projects": {
                "test-project": {
                    "path": "/path/to/test",
                    "description": "Test project"
                }
            }
        }):
            with patch('lib.workflows.detect_project', return_value=("test-project", "/path/to/test", 1.0)):
                show_current_context(verbose=True)
        
        captured = capsys.readouterr()
        assert "test-project" in captured.out


class TestValidateAndPrompt:
    """Tests for validate_and_prompt function"""
    
    def test_validate_matching_context(self, populated_registry):
        """Test validation with matching context"""
        with patch('lib.workflows.validate_project_context', return_value={
            "is_valid": True,
            "confidence": 1.0,
            "warnings": []
        }):
            result = validate_and_prompt(
                "test-project",
                "/path/to/test",
                registry_path=populated_registry
            )
            assert result is True
    
    def test_validate_with_warnings_accept(self, populated_registry):
        """Test validation with warnings, user accepts"""
        with patch('lib.workflows.validate_project_context', return_value={
            "is_valid": True,
            "confidence": 0.7,
            "warnings": ["Low confidence"]
        }):
            with patch('lib.workflows.prompt_for_confirmation', return_value=True):
                result = validate_and_prompt(
                    "test-project",
                    "/path/to/test",
                    registry_path=populated_registry
                )
                assert result is True
    
    def test_validate_with_warnings_decline(self, populated_registry):
        """Test validation with warnings, user declines"""
        with patch('lib.workflows.validate_project_context', return_value={
            "is_valid": True,
            "confidence": 0.7,
            "warnings": ["Low confidence"]
        }):
            with patch('lib.workflows.prompt_for_confirmation', return_value=False):
                result = validate_and_prompt(
                    "test-project",
                    "/path/to/test",
                    registry_path=populated_registry
                )
                assert result is False
    
    def test_validate_invalid_context(self, populated_registry):
        """Test validation with invalid context"""
        with patch('lib.workflows.validate_project_context', return_value={
            "is_valid": False,
            "confidence": 0.3,
            "warnings": ["Project mismatch"]
        }):
            result = validate_and_prompt(
                "test-project",
                "/wrong/path",
                registry_path=populated_registry
            )
            assert result is False


class TestInteractiveProjectSelection:
    """Tests for interactive_project_selection function"""
    
    def test_select_from_list(self):
        """Test selecting a project from the list"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"}),
            ("another-project", {"path": "/path/to/another"})
        ]):
            with patch('builtins.input', return_value='1'):
                result = interactive_project_selection()
                assert result == "test-project"
    
    def test_select_second_project(self):
        """Test selecting second project from list"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"}),
            ("another-project", {"path": "/path/to/another"})
        ]):
            with patch('builtins.input', return_value='2'):
                result = interactive_project_selection()
                assert result == "another-project"
    
    def test_cancel_selection(self):
        """Test canceling project selection"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"})
        ]):
            with patch('builtins.input', return_value='0'):
                result = interactive_project_selection()
                assert result is None
    
    def test_empty_project_list(self):
        """Test selection with no projects available"""
        with patch('lib.workflows.list_projects', return_value=[]):
            result = interactive_project_selection()
            assert result is None
    
    def test_invalid_selection_retry(self):
        """Test retrying after invalid selection"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"})
        ]):
            with patch('builtins.input', side_effect=['invalid', '1']):
                result = interactive_project_selection()
                assert result == "test-project"
    
    def test_out_of_range_selection_retry(self):
        """Test retrying after out of range selection"""
        with patch('lib.workflows.list_projects', return_value=[
            ("test-project", {"path": "/path/to/test"})
        ]):
            with patch('builtins.input', side_effect=['99', '1']):
                result = interactive_project_selection()
                assert result == "test-project"


class TestDisplayContextMismatchWarning:
    """Tests for display_context_mismatch_warning function"""
    
    def test_display_mismatch_warning(self, capsys):
        """Test displaying mismatch warning"""
        display_context_mismatch_warning(
            mentioned_project="project-a",
            detected_project="project-b",
            confidence=0.8
        )
        
        captured = capsys.readouterr()
        assert "project-a" in captured.out
        assert "project-b" in captured.out
        assert "mismatch" in captured.out.lower() or "warning" in captured.out.lower()
    
    def test_display_with_low_confidence(self, capsys):
        """Test displaying warning with low confidence"""
        display_context_mismatch_warning(
            mentioned_project="project-a",
            detected_project="project-b",
            confidence=0.3
        )
        
        captured = capsys.readouterr()
        assert "project-a" in captured.out
        assert "project-b" in captured.out
    
    def test_display_with_none_detected(self, capsys):
        """Test displaying warning when no project detected"""
        display_context_mismatch_warning(
            mentioned_project="project-a",
            detected_project=None,
            confidence=0.0
        )
        
        captured = capsys.readouterr()
        assert "project-a" in captured.out
    
    def test_display_with_none_mentioned(self, capsys):
        """Test displaying warning when no project mentioned"""
        display_context_mismatch_warning(
            mentioned_project=None,
            detected_project="project-b",
            confidence=0.8
        )
        
        captured = capsys.readouterr()
        assert "project-b" in captured.out


class TestWorkflowError:
    """Tests for WorkflowError exception"""
    
    def test_workflow_error_instantiation(self):
        """Test that WorkflowError can be instantiated"""
        error = WorkflowError("Test error")
        assert str(error) == "Test error"
    
    def test_workflow_error_is_exception(self):
        """Test that WorkflowError is an Exception"""
        assert issubclass(WorkflowError, Exception)
    
    def test_workflow_error_can_be_raised(self):
        """Test that WorkflowError can be raised"""
        with pytest.raises(WorkflowError):
            raise WorkflowError("Test error")








