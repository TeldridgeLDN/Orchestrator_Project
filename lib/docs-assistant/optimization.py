"""
Performance Optimization

Query and suggestion optimization for <200ms response times.
"""

import logging
from typing import List, Dict, Any, Optional
from functools import lru_cache
import hashlib
import time

logger = logging.getLogger(__name__)


class PerformanceOptimizer:
    """
    Performance optimization utilities.
    
    Features:
    - Query result caching
    - Vector caching
    - Lazy loading
    - Batch processing
    - Response time monitoring
    """
    
    def __init__(self):
        """Initialize optimizer."""
        self.response_times: List[float] = []
        self.cache_hits = 0
        self.cache_misses = 0
    
    @staticmethod
    @lru_cache(maxsize=1000)
    def hash_query(query: str, context_str: str) -> str:
        """
        Hash query for caching.
        
        Args:
            query: User query
            context_str: Context string
        
        Returns:
            Query hash
        """
        combined = f"{query}|{context_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def cache_query_result(
        self,
        query: str,
        contexts: List,
        result: Any,
        cache: Any
    ):
        """
        Cache query result.
        
        Args:
            query: User query
            contexts: Context list
            result: Query result
            cache: Cache instance
        """
        context_str = self._serialize_contexts(contexts)
        cache_key = self.hash_query(query, context_str)
        
        # Cache for 1 hour by default
        cache.set(cache_key, result.to_dict(), ttl_seconds=3600)
        
        logger.debug(f"Cached query result: {cache_key}")
    
    def get_cached_result(
        self,
        query: str,
        contexts: List,
        cache: Any
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached query result.
        
        Args:
            query: User query
            contexts: Context list
            cache: Cache instance
        
        Returns:
            Cached result or None
        """
        context_str = self._serialize_contexts(contexts)
        cache_key = self.hash_query(query, context_str)
        
        cached = cache.get(cache_key)
        
        if cached:
            self.cache_hits += 1
            logger.debug(f"Cache hit: {cache_key}")
        else:
            self.cache_misses += 1
            logger.debug(f"Cache miss: {cache_key}")
        
        return cached
    
    def track_response_time(self, response_time_ms: float):
        """
        Track response time.
        
        Args:
            response_time_ms: Response time in milliseconds
        """
        self.response_times.append(response_time_ms)
        
        # Keep only last 100 measurements
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-100:]
        
        # Log if exceeding target
        if response_time_ms > 200:
            logger.warning(f"Slow response: {response_time_ms:.1f}ms (target: <200ms)")
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics.
        
        Returns:
            Statistics dictionary
        """
        if not self.response_times:
            return {
                'avg_response_ms': 0,
                'min_response_ms': 0,
                'max_response_ms': 0,
                'p95_response_ms': 0,
                'cache_hit_rate': 0.0
            }
        
        sorted_times = sorted(self.response_times)
        p95_index = int(len(sorted_times) * 0.95)
        
        total_cache_requests = self.cache_hits + self.cache_misses
        cache_hit_rate = self.cache_hits / total_cache_requests if total_cache_requests > 0 else 0.0
        
        return {
            'avg_response_ms': sum(self.response_times) / len(self.response_times),
            'min_response_ms': min(self.response_times),
            'max_response_ms': max(self.response_times),
            'p95_response_ms': sorted_times[p95_index],
            'cache_hit_rate': cache_hit_rate,
            'total_queries': len(self.response_times),
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses
        }
    
    @staticmethod
    def _serialize_contexts(contexts: List) -> str:
        """Serialize contexts for caching."""
        if not contexts:
            return ""
        
        # Simple serialization
        parts = []
        for ctx in contexts:
            parts.append(f"{ctx.type.value}:{ctx.value}")
        
        return "|".join(sorted(parts))
    
    @staticmethod
    def batch_process(
        items: List[Any],
        process_fn,
        batch_size: int = 10
    ) -> List[Any]:
        """
        Process items in batches.
        
        Args:
            items: Items to process
            process_fn: Processing function
            batch_size: Batch size
        
        Returns:
            Processed results
        """
        results = []
        
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = process_fn(batch)
            results.extend(batch_results)
        
        return results


class LazyIndexLoader:
    """
    Lazy loading for documentation index.
    
    Loads index on first access to reduce startup time.
    """
    
    def __init__(self, index_path: str):
        """
        Initialize lazy loader.
        
        Args:
            index_path: Path to index file
        """
        self.index_path = index_path
        self._index = None
        self._loaded = False
    
    @property
    def index(self):
        """Get index (loads on first access)."""
        if not self._loaded:
            self._load_index()
        return self._index
    
    def _load_index(self):
        """Load index from file."""
        start = time.time()
        
        from .indexer import DocumentationIndexer
        indexer = DocumentationIndexer(self.index_path)
        self._index = indexer.index
        self._loaded = True
        
        load_time = (time.time() - start) * 1000
        logger.info(f"Index loaded in {load_time:.1f}ms")


def measure_performance(func):
    """
    Decorator to measure function performance.
    
    Usage:
        @measure_performance
        def my_function():
            pass
    """
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration_ms = (time.time() - start) * 1000
        
        logger.debug(f"{func.__name__} took {duration_ms:.1f}ms")
        
        return result
    
    return wrapper

