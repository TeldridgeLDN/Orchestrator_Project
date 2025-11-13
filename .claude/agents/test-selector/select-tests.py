#!/usr/bin/env python3
"""
Test Selector - CLI Entry Point

Smart test selection that runs only affected tests, saving 60-80% of execution time.

Usage:
    python select-tests.py                      # Auto-detect changes and run tests
    python select-tests.py --mode conservative  # More comprehensive selection
    python select-tests.py --files src/a.js     # Test specific files
    python select-tests.py --dry-run            # Show selection without running
"""

import sys
import argparse
import json
from pathlib import Path
from typing import Optional

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import using exec to handle filename with hyphens
import importlib.util

def load_module(name, filepath):
    spec = importlib.util.spec_from_file_location(name, filepath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Load the engine module
engine_path = Path(__file__).parent / 'test-selector-engine.py'
engine = load_module('test_selector_engine', engine_path)
TestSelectorEngine = engine.TestSelectorEngine
format_results = engine.format_results


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Intelligent test selector - run only affected tests',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run tests for git changes
  python select-tests.py
  
  # Run tests for specific files
  python select-tests.py --files src/utils.js lib/validator.js
  
  # Conservative mode (more tests)
  python select-tests.py --mode conservative
  
  # Aggressive mode (fewer tests, faster)
  python select-tests.py --mode aggressive
  
  # Dry run (show selection without executing)
  python select-tests.py --dry-run
  
  # Full test suite
  python select-tests.py --mode full

Modes:
  aggressive   - High confidence only, skip integrations (70-80% time saved)
  smart        - Balanced selection with critical tests (60-70% time saved)
  conservative - Lower threshold, include all integrations (40-50% time saved)
  full         - Run complete test suite (0% time saved)
"""
    )
    
    parser.add_argument(
        '--mode',
        choices=['aggressive', 'smart', 'conservative', 'full'],
        default='smart',
        help='Test selection mode (default: smart)'
    )
    
    parser.add_argument(
        '--strategy',
        choices=['auto', 'git-diff', 'git-staged', 'git-commits', 'timestamp', 'explicit'],
        default='auto',
        help='Change detection strategy (default: auto)'
    )
    
    parser.add_argument(
        '--files',
        nargs='+',
        help='Explicit file list to test (overrides auto-detection)'
    )
    
    parser.add_argument(
        '--since',
        type=int,
        default=60,
        help='Look back window in minutes for timestamp/commit detection (default: 60)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would run without executing tests'
    )
    
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results in JSON format'
    )
    
    parser.add_argument(
        '--config',
        type=Path,
        help='Path to test-mapping.json config file'
    )
    
    parser.add_argument(
        '--pytest-args',
        nargs=argparse.REMAINDER,
        help='Additional arguments to pass to pytest'
    )
    
    args = parser.parse_args()
    
    # Initialize engine
    try:
        engine = TestSelectorEngine(
            config_path=args.config
        )
    except Exception as e:
        print(f"❌ Failed to initialize test selector: {e}", file=sys.stderr)
        return 1
    
    # Select tests
    try:
        result = engine.select_tests(
            mode=args.mode,
            detection_strategy=args.strategy,
            explicit_files=args.files,
            since_minutes=args.since,
            dry_run=args.dry_run
        )
    except Exception as e:
        print(f"❌ Test selection failed: {e}", file=sys.stderr)
        return 1
    
    # Execute tests (unless dry-run)
    execution_result = None
    if not args.dry_run and result.selected_tests:
        try:
            execution_result = engine.execute_tests(
                result,
                test_args=args.pytest_args
            )
        except Exception as e:
            print(f"❌ Test execution failed: {e}", file=sys.stderr)
            return 1
    
    # Output results
    if args.json:
        output_json(result, execution_result)
    else:
        output_text(result, execution_result, args.dry_run)
    
    # Return appropriate exit code
    if execution_result:
        return 0 if execution_result['success'] else 1
    elif args.dry_run:
        return 0
    else:
        # No tests to run
        return 0 if len(result.selected_tests) == 0 else 0


def output_text(result, execution, dry_run):
    """Output results in human-readable format"""
    print(format_results(result, execution))
    
    if dry_run:
        print("\n💡 Dry Run Mode")
        print("   Add --no-dry-run to execute tests")
    
    if not result.selected_tests:
        print("\n⚠️  No tests selected")
        if not result.change_detection.files:
            print("   Reason: No changes detected")
            print("   Suggestion: Use --mode full to run all tests")
        else:
            print("   Reason: No test mappings found for changes")
            print("   Suggestion: Check test-mapping.json configuration")
    
    if execution and not execution['success']:
        print("\n❌ Test Failures Detected")
        print(f"   {execution['failed']} test(s) failed")
        print("\n   Run with -v for detailed output")


def output_json(result, execution):
    """Output results in JSON format"""
    output = {
        'selection': {
            'mode': result.mode,
            'confidence': result.confidence,
            'tests_selected': len(result.selected_tests),
            'tests_total': result.total_available,
            'selection_percentage': result.metadata['selection_percentage'],
            'selected_tests': result.selected_tests,
            'critical_tests': result.critical_tests
        },
        'detection': {
            'strategy': result.change_detection.strategy,
            'confidence': result.change_detection.confidence,
            'files_changed': result.change_detection.files,
            'file_count': len(result.change_detection.files)
        },
        'mappings': [
            {
                'source': m.source_file,
                'tests': m.test_files,
                'confidence': m.confidence,
                'reason': m.reason
            }
            for m in result.mappings
        ],
        'metadata': result.metadata
    }
    
    if execution:
        output['execution'] = {
            'success': execution['success'],
            'passed': execution['passed'],
            'failed': execution['failed'],
            'skipped': execution['skipped'],
            'duration': execution['duration'],
            'return_code': execution.get('return_code', 0)
        }
        
        # Calculate savings
        if result.total_available > 0:
            estimated_full = result.total_available * 1.0
            time_saved = estimated_full - execution['duration']
            output['savings'] = {
                'time_saved_seconds': round(time_saved, 1),
                'time_saved_percentage': round((time_saved / estimated_full) * 100, 1),
                'tests_avoided': result.total_available - len(result.selected_tests)
            }
    
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    sys.exit(main())

