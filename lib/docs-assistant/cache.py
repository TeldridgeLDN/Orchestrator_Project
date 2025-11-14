"""
Offline Cache

Local caching for offline operation.
"""

import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
import json
import time

logger = logging.getLogger(__name__)


class OfflineCache:
    """
    Local cache for offline operation.
    
    Features:
    - Query result caching
    - TTL-based expiration
    - Size limits
    - Fast lookup
    """
    
    def __init__(
        self,
        cache_path: Optional[str] = None,
        max_size_mb: int = 100,
        default_ttl_seconds: int = 86400  # 24 hours
    ):
        """
        Initialize cache.
        
        Args:
            cache_path: Path to cache file
            max_size_mb: Maximum cache size in MB
            default_ttl_seconds: Default TTL in seconds
        """
        if cache_path is None:
            cache_path = str(Path.home() / '.docs-assistant' / 'cache.json')
        
        self.cache_path = Path(cache_path)
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.max_size_mb = max_size_mb
        self.default_ttl = default_ttl_seconds
        
        self.cache: Dict[str, Any] = self._load_cache()
        
        logger.info(f"Cache initialized at {self.cache_path}")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None
        """
        entry = self.cache.get(key)
        
        if entry is None:
            return None
        
        # Check expiration
        if self._is_expired(entry):
            self.delete(key)
            return None
        
        # Update access time
        entry['accessed_at'] = time.time()
        
        return entry['value']
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[int] = None
    ):
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: TTL in seconds (None for default)
        """
        if ttl_seconds is None:
            ttl_seconds = self.default_ttl
        
        entry = {
            'value': value,
            'created_at': time.time(),
            'accessed_at': time.time(),
            'expires_at': time.time() + ttl_seconds
        }
        
        self.cache[key] = entry
        
        # Check size and clean if needed
        self._check_size()
        
        self._save_cache()
    
    def delete(self, key: str):
        """
        Delete entry from cache.
        
        Args:
            key: Cache key
        """
        if key in self.cache:
            del self.cache[key]
            self._save_cache()
    
    def clear(self):
        """Clear all cache entries."""
        self.cache = {}
        self._save_cache()
        logger.info("Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Statistics dictionary
        """
        total_entries = len(self.cache)
        expired_entries = sum(1 for entry in self.cache.values() if self._is_expired(entry))
        
        # Estimate size
        try:
            cache_json = json.dumps(self.cache)
            size_bytes = len(cache_json.encode('utf-8'))
            size_mb = size_bytes / (1024 * 1024)
        except:
            size_mb = 0.0
        
        return {
            'total_entries': total_entries,
            'expired_entries': expired_entries,
            'size_mb': round(size_mb, 2),
            'max_size_mb': self.max_size_mb
        }
    
    def _load_cache(self) -> Dict[str, Any]:
        """Load cache from file."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load cache: {e}")
        
        return {}
    
    def _save_cache(self):
        """Save cache to file."""
        try:
            with open(self.cache_path, 'w') as f:
                json.dump(self.cache, f)
        except Exception as e:
            logger.error(f"Could not save cache: {e}")
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if entry is expired."""
        return time.time() > entry.get('expires_at', 0)
    
    def _check_size(self):
        """Check cache size and evict if needed."""
        # Clean expired entries first
        expired_keys = [
            key for key, entry in self.cache.items()
            if self._is_expired(entry)
        ]
        for key in expired_keys:
            del self.cache[key]
        
        # Check size
        stats = self.get_stats()
        if stats['size_mb'] > self.max_size_mb:
            # Evict LRU entries
            sorted_entries = sorted(
                self.cache.items(),
                key=lambda x: x[1].get('accessed_at', 0)
            )
            
            # Remove oldest 25%
            to_remove = len(sorted_entries) // 4
            for key, _ in sorted_entries[:to_remove]:
                del self.cache[key]
            
            logger.info(f"Evicted {to_remove} cache entries")

