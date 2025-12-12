"""Base database connection shared by all repositories."""

import psycopg2
from pgvector.psycopg2 import register_vector
import os
from typing import Optional


class DatabaseConnection:
    """PostgreSQL connection with pgvector support and auto-reconnect."""
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/spectra'
        )
        self._conn = None
        self._cursor = None
        self._connect()
        
        # Proxies so repositories keep working even if we reconnect internally
        self.conn = _ConnectionProxy(self)
        self.cursor = _CursorProxy(self)

    def _connect(self):
        """Establish a new database connection/cursor."""
        if self._cursor:
            try:
                self._cursor.close()
            except Exception:
                pass
        if self._conn:
            try:
                self._conn.close()
            except Exception:
                pass
        self._conn = psycopg2.connect(self.connection_string)
        register_vector(self._conn)
        self._cursor = self._conn.cursor()

    def _ensure_connection(self):
        """Make sure the underlying connection is alive."""
        if self._conn is None or self._conn.closed:
            self._connect()
        return self._conn

    def _ensure_cursor(self):
        """Make sure the underlying cursor is alive."""
        conn = self._ensure_connection()
        if self._cursor is None or self._cursor.closed:
            self._cursor = conn.cursor()
        return self._cursor
    
    def execute_sql_file(self, filepath: str):
        """Run SQL from a file (e.g., schema.sql)."""
        with open(filepath, 'r') as f:
            sql = f.read()
        
        cursor = self._ensure_cursor()
        cursor.execute(sql)
        self._ensure_connection().commit()
    
    def commit(self):
        self._ensure_connection().commit()
    
    def rollback(self):
        connection = self._ensure_connection()
        connection.rollback()
    
    def close(self):
        if self._cursor:
            try:
                self._cursor.close()
            except Exception:
                pass
            self._cursor = None
        if self._conn:
            try:
                self._conn.close()
            except Exception:
                pass
            self._conn = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        self.close()


class _ConnectionProxy:
    """Proxy that always returns a live psycopg2 connection."""

    def __init__(self, db_connection: 'DatabaseConnection'):
        self._db = db_connection

    def __getattr__(self, name):
        conn = self._db._ensure_connection()
        return getattr(conn, name)


class _CursorProxy:
    """Proxy that always returns a live psycopg2 cursor."""

    def __init__(self, db_connection: 'DatabaseConnection'):
        self._db = db_connection

    def __getattr__(self, name):
        cursor = self._db._ensure_cursor()
        return getattr(cursor, name)

