"""
NLP-based keyword detection using spaCy.

This module provides robust keyword detection for activation of the
P/E Compression Analysis skill.
"""

from .detector import KeywordDetector

__all__ = ["KeywordDetector"]

