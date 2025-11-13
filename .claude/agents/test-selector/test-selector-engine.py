#!/usr/bin/env python3
"""
Test Selector Engine - Core orchestration for intelligent test selection

Combines change detection, file mapping, and safety rules to determine
the optimal set of tests to run.
"""

import subprocess
from pathlib import Path
from typing import List, Set, Optional, Dict
from dataclasses import dataclass
from datetime import datetime

# Import using dynamic loading for compatibility
import importlib.util
from pathlib import Path as PathLib

def _load_module(name, filename):
    """Dynamically load a module from a file"""
    module_path = PathLib(__file__).parent / filename
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Load dependencies
_change = _load_module('change_detector', 'change-detector.py')
_mapper = _load_module('file_mapper', 'file-mapper.py')

ChangeDetector = _change.ChangeDetector
ChangeDetectionResult = _change.ChangeDetectionResult
FileMapper = _mapper.FileMapper
TestMapping = _mapper.TestMapping


@dataclass
class TestSelectionResult:
    """Result of test selection operation"""
    selected_tests: List[str]
    critical_tests: List[str]
    total_available: int
    confidence: float
    mode: str
    change_detection: ChangeDetectionResult
    mappings: List[TestMapping]
    execution_time: float
    metadata: dict


class TestSelectorEngine:
    """Orchestrates intelligent test selection"""
    
    MODES = {
        'aggressive': {'min_confidence': 0.8, 'include_critical': False},
        'smart': {'min_confidence': 0.6, 'include_critical': True},
        'conservative': {'min_confidence': 0.3, 'include_critical': True},
        'full': {'min_confidence': 0.0, 'include_critical': True}
    }
    
    def __init__(
        self,
        project_root: Optional[Path] = None,
        config_path: Optional[Path] = None
    ):
        """Initialize test selector engine
        
        Args:
            project_root: Root directory of project
            config_path: Path to test-mapping.json config
        """
        self.project_root = project_root or Path.cwd()
        self.change_detector = ChangeDetector(self.project_root)
        self.file_mapper = FileMapper(config_path, self.project_root)
    
    def select_tests(
        self,
        mode: str = 'smart',
        detection_strategy: str = 'auto',
        explicit_files: Optional[List[str]] = None,
        since_minutes: int = 60,
        dry_run: bool = False
    ) -> TestSelectionResult:
        """Select tests to run based on changes and mode
        
        Args:
            mode: Selection mode ('aggressive', 'smart', 'conservative', 'full')
            detection_strategy: Change detection strategy
            explicit_files: User-provided file list
            since_minutes: Look back window for detection
            dry_run: Don't execute, just show what would run
            
        Returns:
            TestSelectionResult with selected tests and metadata
        """
        start_time = datetime.now()
        
        # Validate mode
        if mode not in self.MODES:
            raise ValueError(f"Unknown mode: {mode}. Use: {', '.join(self.MODES.keys())}")
        
        mode_config = self.MODES[mode]
        
        # Step 1: Detect changes
        change_result = self.change_detector.detect(
            strategy=detection_strategy,
            files=explicit_files,
            since_minutes=since_minutes
        )
        
        # Step 2: Map files to tests
        mappings = self.file_mapper.map_files(change_result.files)
        
        # Step 3: Collect candidate tests
        candidate_tests: Set[str] = set()
        
        for mapping in mappings:
            # Filter by confidence threshold
            confidence_value = self._confidence_to_value(mapping.confidence)
            if confidence_value >= mode_config['min_confidence']:
                candidate_tests.update(mapping.test_files)
        
        # Step 4: Add critical tests if configured
        critical_tests = []
        if mode_config['include_critical']:
            critical_tests = self.file_mapper.get_critical_tests()
            candidate_tests.update(critical_tests)
        
        # Step 5: Apply safety rules
        final_tests = self._apply_safety_rules(
            list(candidate_tests),
            change_result,
            mode
        )
        
        # Step 6: Calculate overall confidence
        overall_confidence = self._calculate_overall_confidence(
            mappings,
            len(final_tests),
            mode
        )
        
        # Step 7: Get total available tests for comparison
        total_available = len(self.file_mapper._find_all_tests())
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return TestSelectionResult(
            selected_tests=sorted(final_tests),
            critical_tests=sorted(critical_tests),
            total_available=total_available,
            confidence=overall_confidence,
            mode=mode,
            change_detection=change_result,
            mappings=mappings,
            execution_time=execution_time,
            metadata={
                'dry_run': dry_run,
                'files_changed': len(change_result.files),
                'mappings_count': len(mappings),
                'selection_percentage': round(len(final_tests) / max(total_available, 1) * 100, 1)
            }
        )
    
    def _confidence_to_value(self, confidence_str: str) -> float:
        """Convert confidence string to numeric value"""
        mapping = {
            'high': 0.9,
            'medium': 0.6,
            'low': 0.3
        }
        return mapping.get(confidence_str, 0.5)
    
    def _apply_safety_rules(
        self,
        tests: List[str],
        change_result: ChangeDetectionResult,
        mode: str
    ) -> List[str]:
        """Apply safety rules to test selection"""
        
        # Rule 1: If no changes detected, suggest full run
        if not change_result.files:
            print("⚠️  No changes detected - consider running full test suite")
            if mode != 'full':
                return tests  # Return empty list unless in full mode
        
        # Rule 2: If confidence is very low, warn user
        if change_result.confidence < 0.5:
            print(f"⚠️  Low confidence ({change_result.confidence:.0%}) - results may not be comprehensive")
        
        # Rule 3: If too many files changed, suggest full run
        if len(change_result.files) > 30:
            print(f"⚠️  Many files changed ({len(change_result.files)}) - consider full test suite")
        
        # Rule 4: If core modules changed, include integration tests
        core_patterns = ['lib/', 'core/', 'src/main', 'index.js', 'index.ts']
        core_changed = any(
            any(pattern in f for pattern in core_patterns)
            for f in change_result.files
        )
        
        if core_changed:
            # Add integration tests
            integration_tests = [
                t for t in self.file_mapper._find_all_tests()
                if 'integration' in t.lower()
            ]
            tests.extend(integration_tests)
        
        # Rule 5: Remove duplicates and verify existence
        unique_tests = list(set(tests))
        existing_tests = [t for t in unique_tests if Path(t).exists()]
        
        if len(existing_tests) < len(unique_tests):
            missing = len(unique_tests) - len(existing_tests)
            print(f"⚠️  {missing} test file(s) not found - skipping")
        
        return existing_tests
    
    def _calculate_overall_confidence(
        self,
        mappings: List[TestMapping],
        selected_count: int,
        mode: str
    ) -> float:
        """Calculate overall confidence score"""
        if not mappings or selected_count == 0:
            return 0.5
        
        # Average mapping confidence
        avg_confidence = sum(
            self._confidence_to_value(m.confidence)
            for m in mappings
        ) / len(mappings)
        
        # Adjust by mode
        mode_multiplier = {
            'aggressive': 0.9,
            'smart': 1.0,
            'conservative': 1.1,
            'full': 1.0
        }
        
        confidence = avg_confidence * mode_multiplier.get(mode, 1.0)
        
        # Cap at 1.0
        return min(confidence, 1.0)
    
    def _detect_test_runner(self) -> str:
        """Detect which test runner to use"""
        # Check for package.json
        pkg_json = self.project_root / 'package.json'
        if pkg_json.exists():
            try:
                import json
                with open(pkg_json, 'r') as f:
                    pkg = json.load(f)
                    scripts = pkg.get('scripts', {})
                    
                    # Check for vitest
                    if any('vitest' in s for s in scripts.values()):
                        return 'vitest'
                    # Check for jest
                    if any('jest' in s for s in scripts.values()):
                        return 'jest'
            except Exception:
                pass
        
        # Check for pytest
        if (self.project_root / 'pytest.ini').exists() or \
           (self.project_root / 'setup.cfg').exists():
            return 'pytest'
        
        # Default to pytest
        return 'pytest'
    
    def execute_tests(
        self,
        result: TestSelectionResult,
        test_args: Optional[List[str]] = None
    ) -> Dict:
        """Execute selected tests and return results
        
        Args:
            result: TestSelectionResult from select_tests()
            test_args: Additional test runner arguments
            
        Returns:
            Dictionary with execution results
        """
        if not result.selected_tests:
            return {
                'success': True,
                'passed': 0,
                'failed': 0,
                'skipped': 0,
                'duration': 0.0,
                'output': 'No tests selected'
            }
        
        # Detect test runner
        runner = self._detect_test_runner()
        
        # Build command based on runner
        if runner == 'vitest':
            cmd = ['npx', 'vitest', 'run'] + result.selected_tests
        elif runner == 'jest':
            cmd = ['npx', 'jest'] + result.selected_tests
        else:  # pytest
            cmd = ['pytest'] + result.selected_tests
        
        if test_args:
            cmd.extend(test_args)
        else:
            # Default args for better output
            if runner in ['vitest', 'jest']:
                cmd.append('--reporter=verbose')
            else:
                cmd.extend(['-v', '--tb=short'])
        
        print(f"\n⚙️  Executing {len(result.selected_tests)} test(s) with {runner}...\n")
        print(f"Command: {' '.join(cmd)}\n")
        
        # Execute tests
        start_time = datetime.now()
        
        try:
            proc_result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            duration = (datetime.now() - start_time).total_seconds()
            
            # Parse output based on runner
            output = proc_result.stdout + proc_result.stderr
            
            # Extract test counts based on runner
            if runner == 'vitest':
                # Vitest format: "Test Files  1 passed (1)"
                import re
                passed_match = re.search(r'(\d+) passed', output)
                failed_match = re.search(r'(\d+) failed', output)
                skipped_match = re.search(r'(\d+) skipped', output)
                
                passed = int(passed_match.group(1)) if passed_match else output.count('✓')
                failed = int(failed_match.group(1)) if failed_match else output.count('✗')
                skipped = int(skipped_match.group(1)) if skipped_match else 0
            elif runner == 'jest':
                # Jest format similar to vitest
                import re
                passed_match = re.search(r'(\d+) passed', output)
                failed_match = re.search(r'(\d+) failed', output)
                skipped_match = re.search(r'(\d+) skipped', output)
                
                passed = int(passed_match.group(1)) if passed_match else 0
                failed = int(failed_match.group(1)) if failed_match else 0
                skipped = int(skipped_match.group(1)) if skipped_match else 0
            else:
                # Pytest format
                passed = output.count(' PASSED')
                failed = output.count(' FAILED')
                skipped = output.count(' SKIPPED')
            
            return {
                'success': proc_result.returncode == 0,
                'passed': passed,
                'failed': failed,
                'skipped': skipped,
                'duration': duration,
                'output': output,
                'return_code': proc_result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'passed': 0,
                'failed': len(result.selected_tests),
                'skipped': 0,
                'duration': 300.0,
                'output': 'Test execution timed out after 5 minutes',
                'return_code': -1
            }
        except Exception as e:
            return {
                'success': False,
                'passed': 0,
                'failed': len(result.selected_tests),
                'skipped': 0,
                'duration': 0.0,
                'output': f'Test execution failed: {e}',
                'return_code': -1
            }


def format_results(
    selection: TestSelectionResult,
    execution: Optional[Dict] = None
) -> str:
    """Format results for display"""
    
    output = []
    output.append("╔════════════════════════════════════════════════════════╗")
    output.append("║           Test Selector Agent - Results                ║")
    output.append("╚════════════════════════════════════════════════════════╝")
    output.append("")
    
    # Change Detection
    output.append("📋 Change Detection")
    output.append(f"  Mode: {selection.change_detection.strategy}")
    output.append(f"  Confidence: {selection.change_detection.confidence:.0%}")
    output.append(f"  Files Changed: {len(selection.change_detection.files)}")
    
    if selection.change_detection.files:
        for f in selection.change_detection.files[:5]:
            rel_path = Path(f).name if len(f) > 50 else f
            output.append(f"  - {rel_path}")
        if len(selection.change_detection.files) > 5:
            output.append(f"  ... and {len(selection.change_detection.files) - 5} more")
    output.append("")
    
    # Test Selection
    output.append("🎯 Test Selection")
    output.append(f"  Strategy: {selection.mode}")
    output.append(f"  Confidence: {selection.confidence:.0%}")
    output.append(f"  Tests Selected: {len(selection.selected_tests)} of {selection.total_available} ({selection.metadata['selection_percentage']}%)")
    output.append("")
    
    if selection.selected_tests:
        output.append("  Selected Tests:")
        for test in selection.selected_tests[:10]:
            rel_path = str(Path(test).relative_to(Path.cwd())) if Path(test).is_absolute() else test
            output.append(f"  ✓ {rel_path}")
        if len(selection.selected_tests) > 10:
            output.append(f"  ... and {len(selection.selected_tests) - 10} more")
    output.append("")
    
    # Execution Results
    if execution:
        output.append("⚙️  Execution")
        output.append(f"  Status: {'✓ PASSED' if execution['success'] else '✗ FAILED'}")
        output.append("")
        
        output.append("🎉 Results")
        output.append(f"  Passed: {execution['passed']}")
        output.append(f"  Failed: {execution['failed']}")
        output.append(f"  Skipped: {execution['skipped']}")
        output.append(f"  Time: {execution['duration']:.1f}s")
        output.append("")
    
    # Savings Estimate
    if selection.total_available > 0:
        tests_avoided = selection.total_available - len(selection.selected_tests)
        # Assume avg test takes ~1 second
        estimated_full_time = selection.total_available * 1.0
        estimated_selected_time = len(selection.selected_tests) * 1.0
        
        if execution:
            actual_time = execution['duration']
            time_saved = estimated_full_time - actual_time
        else:
            time_saved = estimated_full_time - estimated_selected_time
        
        if time_saved > 0:
            savings_pct = (time_saved / estimated_full_time) * 100
            output.append("💰 Savings")
            output.append(f"  Time Saved: ~{time_saved:.1f}s ({savings_pct:.0f}%)")
            output.append(f"  Tests Avoided: {tests_avoided} ({tests_avoided/selection.total_available*100:.0f}%)")
            output.append(f"  Confidence: {selection.confidence:.0%}")
    
    return "\n".join(output)


if __name__ == '__main__':
    # This will be called from select-tests.py CLI
    pass

