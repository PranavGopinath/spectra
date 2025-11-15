"""Base database connection shared by all repositories."""

import psycopg2
from pgvector.psycopg2 import register_vector
import os
from typing import Optional


class DatabaseConnection:
    """PostgreSQL connection with pgvector support."""
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/spectra'
        )
        
        self.conn = psycopg2.connect(self.connection_string)
        register_vector(self.conn)
        self.cursor = self.conn.cursor()
    
    def execute_sql_file(self, filepath: str):
        """Run SQL from a file (e.g., schema.sql)."""
        with open(filepath, 'r') as f:
            sql = f.read()
        
        self.cursor.execute(sql)
        self.conn.commit()
    
    def commit(self):
        self.conn.commit()
    
    def rollback(self):
        self.conn.rollback()
    
    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        self.close()

