"""
Unit tests for KeywordDetector with 100% accuracy target.
"""

import pytest
import sys
import os

# Add src to path
src_path = os.path.join(os.path.dirname(__file__), "..", "src")
sys.path.insert(0, src_path)

from nlp.detector import KeywordDetector


class TestKeywordDetectorBasic:
    """Test basic keyword detection functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Use regex fallback for testing without spaCy dependency
        self.detector = KeywordDetector(use_spacy=False)
    
    def test_init_without_spacy(self):
        """Test initialization without spaCy."""
        detector = KeywordDetector(use_spacy=False)
        assert detector is not None
        assert not detector.use_spacy
        assert detector.nlp is None
    
    def test_detect_pe_compression(self):
        """Test detection of 'p/e compression' keyword."""
        assert self.detector.detect("Analyze p/e compression for this stock")
        assert self.detector.detect("What is the P/E compression?")
        assert self.detector.detect("pe compression analysis")
    
    def test_detect_comparative_pe(self):
        """Test detection of 'comparative pe' keyword."""
        assert self.detector.detect("Show me comparative pe data")
        assert self.detector.detect("Comparative P/E analysis needed")
    
    def test_detect_valuation(self):
        """Test detection of 'valuation' keyword."""
        assert self.detector.detect("What's the valuation?")
        assert self.detector.detect("Run a valuation analysis")
        assert self.detector.detect("VALUATION multiple check")
    
    def test_detect_variations(self):
        """Test detection of keyword variations."""
        test_cases = [
            "price to earnings compression",
            "price earnings compression",
            "p/e ratio compression",
            "pe ratio compression",
            "p e compression"
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"Failed to detect: {text}"
    
    def test_detect_semantic_patterns(self):
        """Test detection of semantic pattern variations."""
        test_cases = [
            "pe valuation analysis",
            "p/e valuation check",
            "price earnings ratio",
            "price to earnings",
            "earnings multiple",
            "valuation multiple",
            "comparative valuation"
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"Failed to detect: {text}"
    
    def test_no_false_positives(self):
        """Test that non-matching text returns False."""
        test_cases = [
            "What is the weather?",
            "Hello world",
            "Buy some stocks",
            "Market analysis",
            "Price target",
            ""
        ]
        
        for text in test_cases:
            assert not self.detector.detect(text), f"False positive for: {text}"
    
    def test_case_insensitive(self):
        """Test that detection is case-insensitive."""
        test_cases = [
            "P/E COMPRESSION",
            "p/e compression",
            "P/e CoMpReSsIoN",
            "VALUATION",
            "valuation",
            "VaLuAtIoN"
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"Case sensitivity issue: {text}"
    
    def test_empty_input(self):
        """Test handling of empty input."""
        assert not self.detector.detect("")
        assert not self.detector.detect("   ")
        assert not self.detector.detect(None)
    
    def test_get_detected_keywords(self):
        """Test retrieval of detected keywords."""
        text = "Analyze p/e compression and valuation"
        keywords = self.detector.get_detected_keywords(text)
        
        assert len(keywords) >= 2
        assert any("compression" in kw for kw in keywords)
        assert "valuation" in keywords
    
    def test_get_detected_keywords_empty(self):
        """Test keyword retrieval with no matches."""
        keywords = self.detector.get_detected_keywords("no matches here")
        assert keywords == []
    
    def test_get_detection_details(self):
        """Test detailed detection information."""
        text = "Check the p/e compression"
        details = self.detector.get_detection_details(text)
        
        assert isinstance(details, dict)
        assert "detected" in details
        assert "keywords" in details
        assert "count" in details
        assert "method" in details
        assert "confidence" in details
        
        assert details["detected"] is True
        assert details["count"] > 0
        assert details["method"] == "regex"
        assert details["confidence"] == 1.0
    
    def test_get_detection_details_no_match(self):
        """Test detection details with no matches."""
        details = self.detector.get_detection_details("no matches")
        
        assert details["detected"] is False
        assert details["count"] == 0
        assert details["confidence"] == 0.0
    
    def test_regex_patterns(self):
        """Test regex pattern matching."""
        test_cases = [
            "p/e compression",
            "pe compression",
            "p e compression",
            "price-to-earnings compression",
            "comparative p/e",
            "comparative pe",
            "valuation multiple",
            "earnings multiple"
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"Regex failed for: {text}"
    
    def test_multiple_keywords(self):
        """Test detection of multiple keywords in one text."""
        text = "Analyze p/e compression, valuation, and comparative pe"
        keywords = self.detector.get_detected_keywords(text)
        
        # Should detect at least 2 keywords
        assert len(keywords) >= 2
    
    def test_keywords_in_context(self):
        """Test keyword detection within realistic sentences."""
        test_cases = [
            "Can you help me understand the p/e compression dynamics?",
            "I need a comparative pe analysis for these companies.",
            "What's your view on the current valuation?",
            "The stock shows significant price to earnings compression."
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"Context detection failed: {text}"


class TestKeywordDetectorWithSpacy:
    """Test keyword detection with spaCy (if available)."""
    
    def setup_method(self):
        """Set up test fixtures."""
        try:
            self.detector = KeywordDetector(use_spacy=True)
            self.spacy_available = self.detector.use_spacy
        except Exception:
            self.spacy_available = False
            self.detector = KeywordDetector(use_spacy=False)
    
    @pytest.mark.skipif(not os.environ.get("TEST_WITH_SPACY"), 
                       reason="spaCy not required for basic tests")
    def test_spacy_initialization(self):
        """Test spaCy initialization."""
        if self.spacy_available:
            assert self.detector.nlp is not None
            assert self.detector.use_spacy is True
    
    @pytest.mark.skipif(not os.environ.get("TEST_WITH_SPACY"),
                       reason="spaCy not required for basic tests")
    def test_spacy_detection(self):
        """Test detection using spaCy."""
        if not self.spacy_available:
            pytest.skip("spaCy not available")
        
        test_cases = [
            "p/e compression analysis",
            "comparative pe study",
            "valuation assessment"
        ]
        
        for text in test_cases:
            assert self.detector.detect(text), f"spaCy detection failed: {text}"
    
    def test_fallback_to_regex(self):
        """Test automatic fallback to regex when spaCy unavailable."""
        # Force fallback by simulating spaCy unavailability
        detector = KeywordDetector(use_spacy=False)
        
        assert not detector.use_spacy
        assert detector.detect("p/e compression")


class TestKeywordDetectorPerformance:
    """Test performance and accuracy requirements."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.detector = KeywordDetector(use_spacy=False)
    
    def test_100_percent_accuracy_target(self):
        """
        Test 100% accuracy on known keywords.
        
        This is the critical requirement from Subtask 1.2.
        """
        # All these MUST be detected
        positive_cases = [
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
        ]
        
        for text in positive_cases:
            assert self.detector.detect(text), f"ACCURACY FAILURE: Missed '{text}'"
        
        # All these MUST NOT be detected (no false positives)
        negative_cases = [
            "hello world",
            "stock price",
            "market analysis",
            "earnings report",
            "financial statement"
        ]
        
        for text in negative_cases:
            assert not self.detector.detect(text), f"FALSE POSITIVE: '{text}'"
    
    def test_detection_speed(self):
        """Test that detection is fast enough."""
        import time
        
        text = "Analyze p/e compression for this stock"
        
        # Measure detection time
        start = time.time()
        for _ in range(100):
            self.detector.detect(text)
        end = time.time()
        
        avg_time = (end - start) / 100
        
        # Should be very fast (< 0.01s per detection)
        assert avg_time < 0.01, f"Detection too slow: {avg_time}s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

