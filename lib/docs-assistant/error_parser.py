"""
Error Parser

Extracts structured information from error messages and stack traces.
"""

import logging
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ParsedError:
    """Parsed error information."""
    error_type: str
    message: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    function_name: Optional[str] = None
    language: Optional[str] = None
    stack_trace: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'error_type': self.error_type,
            'message': self.message,
            'file_path': self.file_path,
            'line_number': self.line_number,
            'function_name': self.function_name,
            'language': self.language,
            'stack_trace': self.stack_trace
        }


class ErrorParser:
    """
    Multi-language error parser.
    
    Supports:
    - Python tracebacks
    - JavaScript errors
    - TypeScript errors
    - Compilation errors
    - Runtime errors
    """
    
    # Python traceback pattern
    PYTHON_PATTERN = re.compile(
        r'File "([^"]+)", line (\d+).*?\n.*?(\w+Error): (.+)',
        re.MULTILINE
    )
    
    # JavaScript/TypeScript error pattern
    JS_PATTERN = re.compile(
        r'(\w+Error): (.+?)\n\s+at (?:(\w+) \()?([^:]+):(\d+):(\d+)',
        re.MULTILINE
    )
    
    # Generic error pattern
    GENERIC_PATTERN = re.compile(
        r'(\w+(?:Error|Exception)): (.+)',
        re.IGNORECASE
    )
    
    def __init__(self):
        """Initialize error parser."""
        pass
    
    def parse(self, error_text: str) -> Optional[ParsedError]:
        """
        Parse error text into structured format.
        
        Args:
            error_text: Raw error text or stack trace
        
        Returns:
            Parsed error or None
        """
        # Try Python first
        parsed = self._parse_python(error_text)
        if parsed:
            return parsed
        
        # Try JavaScript/TypeScript
        parsed = self._parse_javascript(error_text)
        if parsed:
            return parsed
        
        # Try generic
        parsed = self._parse_generic(error_text)
        if parsed:
            return parsed
        
        logger.debug("Could not parse error text")
        return None
    
    def _parse_python(self, text: str) -> Optional[ParsedError]:
        """Parse Python traceback."""
        match = self.PYTHON_PATTERN.search(text)
        if match:
            file_path, line_num, error_type, message = match.groups()
            
            # Extract function name from full traceback
            func_match = re.search(r'in (\w+)', text)
            func_name = func_match.group(1) if func_match else None
            
            # Extract full stack trace
            stack_lines = []
            for line in text.split('\n'):
                if line.strip().startswith('File "'):
                    stack_lines.append(line.strip())
            
            return ParsedError(
                error_type=error_type,
                message=message,
                file_path=file_path,
                line_number=int(line_num),
                function_name=func_name,
                language='python',
                stack_trace=stack_lines if stack_lines else None
            )
        
        return None
    
    def _parse_javascript(self, text: str) -> Optional[ParsedError]:
        """Parse JavaScript/TypeScript error."""
        match = self.JS_PATTERN.search(text)
        if match:
            groups = match.groups()
            error_type = groups[0]
            message = groups[1]
            func_name = groups[2] if len(groups) > 2 else None
            file_path = groups[3] if len(groups) > 3 else None
            line_num = groups[4] if len(groups) > 4 else None
            
            # Detect language from file extension
            language = 'javascript'
            if file_path and file_path.endswith('.ts'):
                language = 'typescript'
            
            return ParsedError(
                error_type=error_type,
                message=message,
                file_path=file_path,
                line_number=int(line_num) if line_num else None,
                function_name=func_name,
                language=language
            )
        
        return None
    
    def _parse_generic(self, text: str) -> Optional[ParsedError]:
        """Parse generic error format."""
        match = self.GENERIC_PATTERN.search(text)
        if match:
            error_type, message = match.groups()
            
            return ParsedError(
                error_type=error_type,
                message=message
            )
        
        return None
    
    def extract_keywords(self, error: ParsedError) -> List[str]:
        """
        Extract searchable keywords from parsed error.
        
        Args:
            error: Parsed error
        
        Returns:
            List of keywords
        """
        keywords = []
        
        # Add error type
        keywords.append(error.error_type)
        
        # Extract important words from message
        message_words = re.findall(r'\b\w{4,}\b', error.message)
        keywords.extend(message_words[:5])  # Top 5 words
        
        # Add language
        if error.language:
            keywords.append(error.language)
        
        # Add function name
        if error.function_name:
            keywords.append(error.function_name)
        
        return keywords

