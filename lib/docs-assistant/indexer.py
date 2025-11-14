"""
Documentation Indexer

Builds searchable index from documentation sources.
"""

import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import json
import hashlib

logger = logging.getLogger(__name__)


class DocumentationIndexer:
    """
    Builds and maintains documentation index.
    
    Features:
    - Multi-source indexing (files, URLs, APIs)
    - Incremental updates
    - Metadata extraction
    - Fast lookup
    """
    
    def __init__(self, index_path: Optional[str] = None):
        """
        Initialize indexer.
        
        Args:
            index_path: Path to index file
        """
        if index_path is None:
            index_path = str(Path.home() / '.docs-assistant' / 'index.json')
        
        self.index_path = Path(index_path)
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.index: Dict[str, Any] = self._load_index()
        
        logger.info(f"Indexer initialized with {len(self.index.get('documents', []))} documents")
    
    def index_directory(
        self,
        directory: Path,
        file_patterns: List[str] = None
    ) -> int:
        """
        Index documentation files in directory.
        
        Args:
            directory: Directory to index
            file_patterns: File patterns to match (e.g., ['*.md', '*.rst'])
        
        Returns:
            Number of documents indexed
        """
        if file_patterns is None:
            file_patterns = ['*.md', '*.rst', '*.txt']
        
        indexed_count = 0
        
        for pattern in file_patterns:
            for file_path in directory.rglob(pattern):
                if self._should_index(file_path):
                    doc = self._extract_document(file_path)
                    if doc:
                        self._add_document(doc)
                        indexed_count += 1
        
        self._save_index()
        
        logger.info(f"Indexed {indexed_count} documents from {directory}")
        
        return indexed_count
    
    def index_url(self, url: str, content: str, metadata: Dict[str, Any] = None) -> str:
        """
        Index documentation from URL.
        
        Args:
            url: Documentation URL
            content: Content text
            metadata: Additional metadata
        
        Returns:
            Document ID
        """
        doc = {
            'id': self._compute_id(url),
            'source': url,
            'type': 'url',
            'content': content,
            'metadata': metadata or {},
            'indexed_at': self._now()
        }
        
        self._add_document(doc)
        self._save_index()
        
        logger.info(f"Indexed URL: {url}")
        
        return doc['id']
    
    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document by ID.
        
        Args:
            doc_id: Document ID
        
        Returns:
            Document or None
        """
        documents = self.index.get('documents', [])
        for doc in documents:
            if doc['id'] == doc_id:
                return doc
        
        return None
    
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search index.
        
        Args:
            query: Search query
            max_results: Maximum results
        
        Returns:
            Matching documents
        """
        query_lower = query.lower()
        scored_docs = []
        
        for doc in self.index.get('documents', []):
            score = 0.0
            content = doc.get('content', '').lower()
            title = doc.get('metadata', {}).get('title', '').lower()
            
            # Simple scoring
            if query_lower in title:
                score += 2.0
            if query_lower in content:
                score += 1.0
            
            if score > 0:
                scored_docs.append((doc, score))
        
        # Sort by score
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        return [doc for doc, _ in scored_docs[:max_results]]
    
    def _load_index(self) -> Dict[str, Any]:
        """Load index from file."""
        if self.index_path.exists():
            try:
                with open(self.index_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load index: {e}")
        
        return {'documents': [], 'metadata': {}}
    
    def _save_index(self):
        """Save index to file."""
        try:
            with open(self.index_path, 'w') as f:
                json.dump(self.index, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save index: {e}")
    
    def _should_index(self, file_path: Path) -> bool:
        """Check if file should be indexed."""
        # Skip hidden files
        if any(part.startswith('.') for part in file_path.parts):
            return False
        
        # Skip very large files (>1MB)
        if file_path.stat().st_size > 1_000_000:
            logger.debug(f"Skipping large file: {file_path}")
            return False
        
        return True
    
    def _extract_document(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Extract document from file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extract title from first heading
            title = file_path.stem
            if content.startswith('#'):
                first_line = content.split('\n')[0]
                title = first_line.strip('# ')
            
            return {
                'id': self._compute_id(str(file_path)),
                'source': str(file_path),
                'type': 'file',
                'content': content,
                'metadata': {
                    'title': title,
                    'extension': file_path.suffix
                },
                'indexed_at': self._now()
            }
        
        except Exception as e:
            logger.warning(f"Could not extract document from {file_path}: {e}")
            return None
    
    def _add_document(self, doc: Dict[str, Any]):
        """Add document to index."""
        documents = self.index.get('documents', [])
        
        # Remove existing document with same ID
        documents = [d for d in documents if d['id'] != doc['id']]
        
        # Add new document
        documents.append(doc)
        
        self.index['documents'] = documents
    
    def _compute_id(self, source: str) -> str:
        """Compute document ID from source."""
        return hashlib.md5(source.encode()).hexdigest()[:16]
    
    def _now(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()

