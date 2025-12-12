"""User repository for managing users and ratings."""

import numpy as np
from typing import Optional, List, Dict
import uuid
from datetime import datetime


class UserRepository:
    """Repository for user and rating operations."""
    
    def __init__(self, db_connection):
        self.conn = db_connection.conn
        self.cursor = db_connection.cursor
    
    def create_user(
        self, 
        email: str, 
        username: Optional[str] = None,
        password_hash: Optional[str] = None,
        oauth_provider: Optional[str] = None,
        oauth_id: Optional[str] = None
    ) -> Dict:
        """Create a new user."""
        user_id = uuid.uuid4()
        query = """
            INSERT INTO users (id, email, username, password_hash, oauth_provider, oauth_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, email, username, created_at, oauth_provider
        """
        self.cursor.execute(query, (str(user_id), email, username, password_hash, oauth_provider, oauth_id))
        row = self.cursor.fetchone()
        self.conn.commit()
        
        return {
            'id': str(row[0]),
            'email': row[1],
            'username': row[2],
            'created_at': row[3].isoformat() if row[3] else None,
            'oauth_provider': row[4]
        }
    
    def get_user_with_password(self, email: str) -> Optional[Dict]:
        """Get user by email including password hash."""
        query = """
            SELECT id, email, username, password_hash, oauth_provider, oauth_id, created_at 
            FROM users 
            WHERE email = %s
        """
        self.cursor.execute(query, (email,))
        row = self.cursor.fetchone()
        
        if not row:
            return None
        
        return {
            'id': str(row[0]),
            'email': row[1],
            'username': row[2],
            'password_hash': row[3],
            'oauth_provider': row[4],
            'oauth_id': row[5],
            'created_at': row[6].isoformat() if row[6] else None
        }
    
    def get_user_by_oauth(self, provider: str, oauth_id: str) -> Optional[Dict]:
        """Get user by OAuth provider and ID."""
        query = """
            SELECT id, email, username, created_at, oauth_provider 
            FROM users 
            WHERE oauth_provider = %s AND oauth_id = %s
        """
        self.cursor.execute(query, (provider, oauth_id))
        row = self.cursor.fetchone()
        
        if not row:
            return None
        
        return {
            'id': str(row[0]),
            'email': row[1],
            'username': row[2],
            'created_at': row[3].isoformat() if row[3] else None,
            'oauth_provider': row[4]
        }
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID."""
        query = "SELECT id, email, username, created_at, oauth_provider FROM users WHERE id = %s"
        self.cursor.execute(query, (user_id,))
        row = self.cursor.fetchone()
        
        if not row:
            return None
        
        return {
            'id': str(row[0]),
            'email': row[1],
            'username': row[2],
            'created_at': row[3].isoformat() if row[3] else None,
            'oauth_provider': row[4]
        }
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email (without sensitive data)."""
        query = "SELECT id, email, username, created_at, oauth_provider FROM users WHERE email = %s"
        self.cursor.execute(query, (email,))
        row = self.cursor.fetchone()
        
        if not row:
            return None
        
        return {
            'id': str(row[0]),
            'email': row[1],
            'username': row[2],
            'created_at': row[3].isoformat() if row[3] else None,
            'oauth_provider': row[4]
        }
    
    def link_oauth_to_user(self, user_id: str, oauth_provider: str, oauth_id: str) -> bool:
        """Link an OAuth provider to an existing user account."""
        query = """
            UPDATE users 
            SET oauth_provider = %s, oauth_id = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        self.cursor.execute(query, (oauth_provider, oauth_id, user_id))
        self.conn.commit()
        return self.cursor.rowcount > 0
    
    def add_rating(
        self,
        user_id: str,
        item_id: str,
        rating: Optional[int] = None,
        notes: Optional[str] = None,
        favorite: Optional[bool] = None,
        want_to_consume: Optional[bool] = None
    ) -> Dict:
        """Add or update a rating."""
        try:
            query = """
                INSERT INTO user_ratings (user_id, item_id, rating, notes, favorite, want_to_consume)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, item_id)
                DO UPDATE SET 
                    rating = COALESCE(EXCLUDED.rating, user_ratings.rating),
                    notes = COALESCE(EXCLUDED.notes, user_ratings.notes),
                    favorite = COALESCE(EXCLUDED.favorite, user_ratings.favorite),
                    want_to_consume = COALESCE(EXCLUDED.want_to_consume, user_ratings.want_to_consume),
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, user_id, item_id, rating, notes, favorite, want_to_consume, created_at, updated_at
            """
            self.cursor.execute(query, (user_id, item_id, rating, notes, favorite, want_to_consume))
            row = self.cursor.fetchone()
            self.conn.commit()
            
            return {
                'id': str(row[0]),
                'user_id': str(row[1]),
                'item_id': row[2],
                'rating': row[3],
                'notes': row[4],
                'favorite': row[5],
                'want_to_consume': row[6],
                'created_at': row[7].isoformat() if row[7] else None,
                'updated_at': row[8].isoformat() if row[8] else None
            }
        except Exception as e:
            # Rollback on any error to prevent aborted transaction state
            self.conn.rollback()
            raise
    
    def get_user_ratings(self, user_id: str) -> List[Dict]:
        """Get all ratings for a user with item details."""
        query = """
            SELECT 
                ur.id, ur.item_id, ur.rating, ur.notes, ur.favorite, ur.want_to_consume,
                ur.created_at, ur.updated_at,
                mi.title, mi.media_type, mi.year, mi.description, mi.metadata
            FROM user_ratings ur
            JOIN media_items mi ON ur.item_id = mi.id
            WHERE ur.user_id = %s AND ur.rating IS NOT NULL
            ORDER BY ur.updated_at DESC
        """
        self.cursor.execute(query, (user_id,))
        rows = self.cursor.fetchall()
        
        return [
            {
                'id': str(row[0]),
                'item_id': row[1],
                'rating': row[2],
                'notes': row[3],
                'favorite': row[4],
                'want_to_consume': row[5],
                'created_at': row[6].isoformat() if row[6] else None,
                'updated_at': row[7].isoformat() if row[7] else None,
                'item': {
                    'id': row[1],
                    'title': row[8],
                    'media_type': row[9],
                    'year': row[10],
                    'description': row[11],
                    'metadata': row[12] if isinstance(row[12], dict) else {}
                }
            }
            for row in rows
        ]
    
    def get_user_ratings_with_embeddings(self, user_id: str) -> List[Dict]:
        """Get user ratings with item embeddings for aggregation."""
        query = """
            SELECT ur.rating, mi.embedding, mi.taste_vector
            FROM user_ratings ur
            JOIN media_items mi ON ur.item_id = mi.id
            WHERE ur.user_id = %s AND ur.rating IS NOT NULL
        """
        self.cursor.execute(query, (user_id,))
        rows = self.cursor.fetchall()
        
        return [
            {
                'rating': row[0],
                'embedding': row[1],  # 384D vector
                'taste_vector': row[2]  # 8D vector
            }
            for row in rows
        ]
    
    def get_rated_item_ids(self, user_id: str) -> List[str]:
        """Get list of item IDs the user has rated."""
        query = "SELECT item_id FROM user_ratings WHERE user_id = %s"
        self.cursor.execute(query, (user_id,))
        return [row[0] for row in self.cursor.fetchall()]
    
    def delete_rating(self, user_id: str, item_id: str) -> bool:
        """Delete a rating."""
        query = "DELETE FROM user_ratings WHERE user_id = %s AND item_id = %s"
        self.cursor.execute(query, (user_id, item_id))
        deleted = self.cursor.rowcount > 0
        self.conn.commit()
        return deleted
    
    def get_favorites(self, user_id: str) -> List[Dict]:
        """Get all favorite items for a user."""
        query = """
            SELECT 
                ur.id, ur.item_id, ur.rating, ur.notes, ur.created_at, ur.updated_at,
                mi.title, mi.media_type, mi.year, mi.description, mi.metadata
            FROM user_ratings ur
            JOIN media_items mi ON ur.item_id = mi.id
            WHERE ur.user_id = %s AND ur.favorite = TRUE
            ORDER BY ur.updated_at DESC
        """
        self.cursor.execute(query, (user_id,))
        rows = self.cursor.fetchall()
        
        return [
            {
                'id': str(row[0]),
                'item_id': row[1],
                'rating': row[2],
                'notes': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'updated_at': row[5].isoformat() if row[5] else None,
                'item': {
                    'id': row[1],
                    'title': row[6],
                    'media_type': row[7],
                    'year': row[8],
                    'description': row[9],
                    'metadata': row[10] if isinstance(row[10], dict) else {}
                }
            }
            for row in rows
        ]
    
    def get_my_list(self, user_id: str) -> List[Dict]:
        """Get all items in user's My List."""
        query = """
            SELECT 
                ur.id, ur.item_id, ur.rating, ur.notes, ur.created_at, ur.updated_at,
                mi.title, mi.media_type, mi.year, mi.description, mi.metadata
            FROM user_ratings ur
            JOIN media_items mi ON ur.item_id = mi.id
            WHERE ur.user_id = %s AND ur.want_to_consume = TRUE
            ORDER BY ur.created_at DESC
        """
        self.cursor.execute(query, (user_id,))
        rows = self.cursor.fetchall()
        
        return [
            {
                'id': str(row[0]),
                'item_id': row[1],
                'rating': row[2],
                'notes': row[3],
                'created_at': row[4].isoformat() if row[4] else None,
                'updated_at': row[5].isoformat() if row[5] else None,
                'item': {
                    'id': row[1],
                    'title': row[6],
                    'media_type': row[7],
                    'year': row[8],
                    'description': row[9],
                    'metadata': row[10] if isinstance(row[10], dict) else {}
                }
            }
            for row in rows
        ]

