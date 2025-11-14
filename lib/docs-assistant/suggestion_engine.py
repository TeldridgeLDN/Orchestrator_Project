"""
Suggestion Engine

ML-powered documentation ranking using TF-IDF and cosine similarity.
"""

import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import uuid

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    TfidfVectorizer = None
    cosine_similarity = None
    np = None

from .models import Context, Suggestion, SuggestionType

logger = logging.getLogger(__name__)


class SuggestionEngine:
    """
    ML-powered suggestion ranking.
    
    Uses TF-IDF vectorization and cosine similarity to rank
    documentation relevance based on query and context.
    """
    
    def __init__(self, index_path: Optional[str] = None):
        """
        Initialize suggestion engine.
        
        Args:
            index_path: Path to documentation index
        """
        if not SKLEARN_AVAILABLE:
            logger.warning("scikit-learn not available, using fallback ranking")
        
        self.index_path = Path(index_path) if index_path else None
        self.vectorizer = TfidfVectorizer(stop_words='english') if SKLEARN_AVAILABLE else None
        
        # Sample documentation (in production, load from index)
        self.documents = self._load_sample_docs()
        
        # Fit vectorizer if available
        if self.vectorizer and self.documents:
            doc_texts = [doc['content'] for doc in self.documents]
            self.doc_vectors = self.vectorizer.fit_transform(doc_texts)
        else:
            self.doc_vectors = None
    
    def suggest(
        self,
        query: str,
        contexts: List[Context],
        max_results: int = 5
    ) -> List[Suggestion]:
        """
        Generate documentation suggestions.
        
        Args:
            query: User query
            contexts: Development contexts
            max_results: Maximum suggestions
        
        Returns:
            Ranked suggestions
        """
        if SKLEARN_AVAILABLE and self.vectorizer and self.doc_vectors is not None:
            return self._ml_suggest(query, contexts, max_results)
        else:
            return self._fallback_suggest(query, contexts, max_results)
    
    def _ml_suggest(
        self,
        query: str,
        contexts: List[Context],
        max_results: int
    ) -> List[Suggestion]:
        """ML-based suggestion using TF-IDF and cosine similarity."""
        # Enhance query with context
        enhanced_query = self._enhance_query(query, contexts)
        
        # Vectorize query
        query_vector = self.vectorizer.transform([enhanced_query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_vector, self.doc_vectors)[0]
        
        # Get top results
        top_indices = np.argsort(similarities)[::-1][:max_results]
        
        suggestions = []
        for idx in top_indices:
            doc = self.documents[idx]
            similarity = float(similarities[idx])
            
            if similarity > 0.1:  # Relevance threshold
                suggestion = Suggestion(
                    id=str(uuid.uuid4()),
                    type=SuggestionType(doc['type']),
                    title=doc['title'],
                    content=doc['content'],
                    source=doc['source'],
                    relevance_score=similarity,
                    code_examples=doc.get('code_examples', []),
                    tags=doc.get('tags', [])
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _fallback_suggest(
        self,
        query: str,
        contexts: List[Context],
        max_results: int
    ) -> List[Suggestion]:
        """Fallback suggestion using simple keyword matching."""
        query_lower = query.lower()
        scored_docs = []
        
        for doc in self.documents:
            score = 0.0
            content_lower = doc['content'].lower()
            title_lower = doc['title'].lower()
            
            # Simple scoring
            if query_lower in title_lower:
                score += 0.5
            if query_lower in content_lower:
                score += 0.3
            
            # Context boost
            for context in contexts:
                if context.value.lower() in content_lower:
                    score += 0.2
            
            if score > 0:
                scored_docs.append((doc, score))
        
        # Sort by score
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        suggestions = []
        for doc, score in scored_docs[:max_results]:
            suggestion = Suggestion(
                id=str(uuid.uuid4()),
                type=SuggestionType(doc['type']),
                title=doc['title'],
                content=doc['content'],
                source=doc['source'],
                relevance_score=min(score, 1.0),
                code_examples=doc.get('code_examples', []),
                tags=doc.get('tags', [])
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def _enhance_query(self, query: str, contexts: List[Context]) -> str:
        """Enhance query with context information."""
        enhanced = query
        
        for context in contexts:
            # Add relevant context to query
            if context.type.value in ['file', 'task', 'error']:
                enhanced += f" {context.value}"
            
            # Add language context
            if 'language' in context.metadata:
                enhanced += f" {context.metadata['language']}"
        
        return enhanced
    
    def _load_sample_docs(self) -> List[Dict[str, Any]]:
        """Load sample documentation (placeholder)."""
        return [
            {
                'title': 'Python Error Handling Best Practices',
                'content': 'Learn how to handle exceptions in Python using try-except blocks. Use specific exception types and avoid bare except clauses.',
                'source': 'python-docs',
                'type': 'best_practice',
                'code_examples': ['try:\n    risky_operation()\nexcept ValueError as e:\n    handle_error(e)'],
                'tags': ['python', 'exceptions', 'error-handling']
            },
            {
                'title': 'Git Branch Management',
                'content': 'Create feature branches for new work. Use git checkout -b to create and switch to new branches.',
                'source': 'git-docs',
                'type': 'tutorial',
                'code_examples': ['git checkout -b feature/new-feature'],
                'tags': ['git', 'branching', 'workflow']
            },
            {
                'title': 'TypeScript Type Guards',
                'content': 'Use type guards to narrow types in TypeScript. Common patterns include typeof, instanceof, and custom type predicates.',
                'source': 'typescript-docs',
                'type': 'api_doc',
                'code_examples': ['function isString(val: any): val is string {\n    return typeof val === "string";\n}'],
                'tags': ['typescript', 'types', 'type-guards']
            },
            {
                'title': 'SQLite Performance Optimization',
                'content': 'Optimize SQLite queries with proper indexing. Create indexes on frequently queried columns.',
                'source': 'sqlite-docs',
                'type': 'best_practice',
                'code_examples': ['CREATE INDEX idx_column ON table(column);'],
                'tags': ['sqlite', 'performance', 'indexing']
            },
            {
                'title': 'Async/Await in Python',
                'content': 'Use async/await for asynchronous programming in Python. Define async functions with async def.',
                'source': 'python-docs',
                'type': 'code_example',
                'code_examples': ['async def fetch_data():\n    result = await api_call()\n    return result'],
                'tags': ['python', 'async', 'concurrency']
            }
        ]

