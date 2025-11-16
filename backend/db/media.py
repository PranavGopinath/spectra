"""Media repository for handling media_items table operations."""

import numpy as np
from typing import List, Dict, Optional
import json


class MediaRepository:
    
    def __init__(self, db_connection):
        self.conn = db_connection.conn
        self.cursor = db_connection.cursor
    
    def insert_item(self, item: Dict):
        """Insert a single media item into the database."""
        query = """
            INSERT INTO media_items 
            (id, title, media_type, year, description, metadata, embedding, taste_vector)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            item['id'],
            item['title'],
            item['media_type'],
            item.get('year'),
            item.get('description'),
            json.dumps(item.get('metadata', {})),
            item['embedding'].tolist() if isinstance(item['embedding'], np.ndarray) else item['embedding'],
            item['taste_vector'].tolist() if isinstance(item['taste_vector'], np.ndarray) else item['taste_vector']
        )
        
        self.cursor.execute(query, values)
        self.conn.commit()
    
    def batch_insert(self, items: List[Dict]):
        """Insert multiple media items at once."""
        for item in items:
            self.insert_item(item)
    
    def search_by_taste(
        self,
        taste_vector: np.ndarray,
        media_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """Find similar items by taste vector using cosine distance."""
        taste_vec_list = taste_vector.tolist() if isinstance(taste_vector, np.ndarray) else taste_vector
        
        query = """
            SELECT 
                id, title, media_type, year, description, metadata,
                1 - (taste_vector <=> %s::vector) / 2 AS similarity
            FROM media_items
            WHERE (%s IS NULL OR media_type = %s)
            ORDER BY taste_vector <=> %s::vector
            LIMIT %s
        """
        
        self.cursor.execute(query, (taste_vec_list, media_type, media_type, taste_vec_list, limit))
        rows = self.cursor.fetchall()
        
        # Convert rows to dictionaries
        results = []
        for row in rows:
            results.append({
                'id': row[0],
                'title': row[1],
                'media_type': row[2],
                'year': row[3],
                'description': row[4],
                'metadata': row[5],
                'similarity': float(row[6])
            })
        
        return results
    
    def get_item_by_id(self, item_id: str) -> Optional[Dict]:
        """Get a specific item by ID."""
        query = """
            SELECT id, title, media_type, year, description, metadata, taste_vector
            FROM media_items
            WHERE id = %s
        """
        
        self.cursor.execute(query, (item_id,))
        row = self.cursor.fetchone()
        
        if not row:
            return None
        
        # Convert taste_vector to list if it's a numpy array or pgvector type
        taste_vector = row[6]
        if taste_vector is not None:
            if isinstance(taste_vector, np.ndarray):
                taste_vector = taste_vector.tolist()
            elif hasattr(taste_vector, 'tolist'):
                taste_vector = taste_vector.tolist()
            elif isinstance(taste_vector, (list, tuple)):
                taste_vector = list(taste_vector)
        
        # Parse metadata if it's a JSON string (shouldn't happen with JSONB, but be safe)
        metadata = row[5]
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except (json.JSONDecodeError, TypeError):
                pass  # Keep as string if parsing fails
        
        return {
            'id': row[0],
            'title': row[1],
            'media_type': row[2],
            'year': row[3],
            'description': row[4],
            'metadata': metadata,
            'taste_vector': taste_vector
        }
    
    def get_all_by_type(self, media_type: str, limit: int = 100) -> List[Dict]:
        """Get all items of a specific media type."""
        query = """
            SELECT id, title, media_type, year, description, metadata
            FROM media_items
            WHERE media_type = %s
            LIMIT %s
        """
        
        self.cursor.execute(query, (media_type, limit))
        rows = self.cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                'id': row[0],
                'title': row[1],
                'media_type': row[2],
                'year': row[3],
                'description': row[4],
                'metadata': row[5]
            })
        
        return results
    
    def count_items(self, media_type: Optional[str] = None) -> int:
        """Count total items, optionally filtered by type."""
        if media_type:
            query = "SELECT COUNT(*) FROM media_items WHERE media_type = %s"
            self.cursor.execute(query, (media_type,))
        else:
            query = "SELECT COUNT(*) FROM media_items"
            self.cursor.execute(query)
        
        return self.cursor.fetchone()[0]

