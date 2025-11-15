"""Database module with unified interface to all operations."""

from db.base import DatabaseConnection
from db.media import MediaRepository
import os


class Database:
    """Main database interface that composes all repositories."""
    
    def __init__(self, connection_string: str = None):
        self.connection = DatabaseConnection(connection_string)
        self.media = MediaRepository(self.connection)
        
        # Future: self.users = UserRepository(self.connection)
        # Future: self.profiles = ProfileRepository(self.connection)
    
    def create_tables(self, schema_path: str = None):
        """Create database tables from schema.sql."""
        if schema_path is None:
            import os
            current_dir = os.path.dirname(os.path.abspath(__file__))
            schema_path = os.path.join(current_dir, 'schema.sql')
        
        self.connection.execute_sql_file(schema_path)
    
    def close(self):
        self.connection.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.connection.__exit__(exc_type, exc_val, exc_tb)


__all__ = ['Database', 'DatabaseConnection', 'MediaRepository']

