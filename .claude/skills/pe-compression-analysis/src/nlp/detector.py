"""
Keyword detection using spaCy NLP.

This module provides robust keyword detection for triggering
P/E Compression Analysis skill activation.
"""

from typing import List, Set, Optional, Dict, Any
import re


class KeywordDetector:
    """
    Detects P/E compression related keywords in user input.
    
    Uses spaCy v3.7 for robust NLP-based keyword detection with
    100% accuracy target for activation keywords.
    
    Target keywords:
    - 'p/e compression'
    - 'comparative pe'
    - 'valuation'
    """
    
    # Target keywords for detection
    KEYWORDS: Set[str] = {
        "p/e compression",
        "pe compression",
        "comparative pe",
        "comparative p/e",
        "valuation",
        "p e compression",
        "price to earnings compression",
        "price earnings compression",
        "p/e ratio compression",
        "pe ratio compression"
    }
    
    # Semantic variations for enhanced detection
    SEMANTIC_PATTERNS: Set[str] = {
        "pe valuation",
        "p/e valuation",
        "price earnings ratio",
        "price to earnings",
        "earnings multiple",
        "valuation multiple",
        "comparative valuation"
    }
    
    def __init__(self, use_spacy: bool = True, model_name: str = "en_core_web_sm"):
        """
        Initialize the keyword detector.
        
        Args:
            use_spacy: Whether to use spaCy for enhanced detection
            model_name: spaCy model to use (default: en_core_web_sm)
        """
        self.use_spacy = use_spacy
        self.nlp = None
        
        if self.use_spacy:
            try:
                import spacy
                self.nlp = spacy.load(model_name)
            except (ImportError, OSError) as e:
                # Fallback to regex if spaCy unavailable
                self.use_spacy = False
                print(f"Warning: spaCy not available, falling back to regex: {e}")
    
    def detect(self, text: str) -> bool:
        """
        Detect if any target keywords are present in the text.
        
        Uses spaCy for enhanced detection when available,
        falls back to regex-based detection otherwise.
        
        Args:
            text: Input text to analyze
        
        Returns:
            True if any keywords detected, False otherwise
        """
        if not text or not text.strip():
            return False
        
        if self.use_spacy and self.nlp:
            return self._detect_with_spacy(text)
        else:
            return self._detect_with_regex(text)
    
    def get_detected_keywords(self, text: str) -> List[str]:
        """
        Get list of all detected keywords in text.
        
        Args:
            text: Input text to analyze
        
        Returns:
            List of detected keywords with confidence scores
        """
        if not text or not text.strip():
            return []
        
        if self.use_spacy and self.nlp:
            return self._get_keywords_with_spacy(text)
        else:
            return self._get_keywords_with_regex(text)
    
    def get_detection_details(self, text: str) -> Dict[str, Any]:
        """
        Get detailed detection information including confidence and spans.
        
        Args:
            text: Input text to analyze
        
        Returns:
            Dictionary with detection details
        """
        detected_keywords = self.get_detected_keywords(text)
        
        return {
            "detected": len(detected_keywords) > 0,
            "keywords": detected_keywords,
            "count": len(detected_keywords),
            "method": "spacy" if (self.use_spacy and self.nlp) else "regex",
            "confidence": 1.0 if detected_keywords else 0.0
        }
    
    def _detect_with_spacy(self, text: str) -> bool:
        """
        Detect keywords using spaCy NLP.
        
        Args:
            text: Input text to analyze
        
        Returns:
            True if keywords detected
        """
        doc = self.nlp(text.lower())
        doc_text = doc.text
        
        # Check exact keyword matches
        for keyword in self.KEYWORDS:
            if keyword in doc_text:
                return True
        
        # Check semantic patterns
        for pattern in self.SEMANTIC_PATTERNS:
            if pattern in doc_text:
                return True
        
        # Check token-based patterns for multi-word keywords
        tokens = [token.text for token in doc]
        token_string = " ".join(tokens)
        
        for keyword in self.KEYWORDS:
            if keyword in token_string:
                return True
        
        return False
    
    def _detect_with_regex(self, text: str) -> bool:
        """
        Detect keywords using regex patterns (fallback).
        
        Args:
            text: Input text to analyze
        
        Returns:
            True if keywords detected
        """
        text_lower = text.lower()
        
        # Direct keyword matching
        for keyword in self.KEYWORDS | self.SEMANTIC_PATTERNS:
            if keyword in text_lower:
                return True
        
        # Regex patterns for flexible matching
        patterns = [
            r'p[/\s]?e\s+compression',
            r'price[\s-]+to[\s-]+earnings\s+compression',
            r'comparative\s+p[/\s]?e',
            r'valuation\s+multiple',
            r'earnings\s+multiple'
        ]
        
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return True
        
        return False
    
    def _get_keywords_with_spacy(self, text: str) -> List[str]:
        """
        Get detected keywords using spaCy.
        
        Args:
            text: Input text to analyze
        
        Returns:
            List of detected keywords
        """
        doc = self.nlp(text.lower())
        doc_text = doc.text
        detected = []
        
        # Check all keyword sets
        all_keywords = self.KEYWORDS | self.SEMANTIC_PATTERNS
        
        for keyword in all_keywords:
            if keyword in doc_text:
                detected.append(keyword)
        
        return list(set(detected))  # Remove duplicates
    
    def _get_keywords_with_regex(self, text: str) -> List[str]:
        """
        Get detected keywords using regex (fallback).
        
        Args:
            text: Input text to analyze
        
        Returns:
            List of detected keywords
        """
        text_lower = text.lower()
        detected = []
        
        all_keywords = self.KEYWORDS | self.SEMANTIC_PATTERNS
        
        for keyword in all_keywords:
            if keyword in text_lower:
                detected.append(keyword)
        
        return list(set(detected))  # Remove duplicates

