"""Database migration runner for Spectra."""

import os
import sys
from pathlib import Path
from db.base import DatabaseConnection


def get_migration_files():
    """Get all migration files in order."""
    migrations_dir = Path(__file__).parent
    if not migrations_dir.exists():
        return []
    
    migration_files = sorted([
        f for f in migrations_dir.iterdir() 
        if f.is_file() and f.suffix == '.sql'
    ])
    
    return migration_files


def run_migrations(connection_string: str = None):
    """Run all pending migrations."""
    db = DatabaseConnection(connection_string)
    
    try:
        # Check if migrations table exists
        db.cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'schema_migrations'
            )
        """)
        migrations_table_exists = db.cursor.fetchone()[0]
        
        if not migrations_table_exists:
            # Create migrations tracking table
            db.cursor.execute("""
                CREATE TABLE schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            db.conn.commit()
            print("✓ Created schema_migrations table")
        
        # Get already applied migrations
        db.cursor.execute("SELECT version FROM schema_migrations")
        applied_versions = {row[0] for row in db.cursor.fetchall()}
        
        # Get all migration files
        migration_files = get_migration_files()
        
        if not migration_files:
            print("No migration files found")
            return
        
        # Run pending migrations
        for migration_file in migration_files:
            version = migration_file.stem  # e.g., "001_add_users_and_ratings"
            
            if version in applied_versions:
                print(f"⏭️  Skipping {version} (already applied)")
                continue
            
            print(f"🔄 Running migration: {version}")
            
            try:
                # Read and execute migration
                with open(migration_file, 'r') as f:
                    sql = f.read()
                
                db.cursor.execute(sql)
                
                # Record migration
                db.cursor.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s)",
                    (version,)
                )
                
                db.conn.commit()
                print(f"✓ Successfully applied {version}")
                
            except Exception as e:
                db.conn.rollback()
                print(f"✗ Error applying {version}: {e}")
                raise
        
        print("\n✓ All migrations complete")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        db.conn.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run database migrations')
    parser.add_argument(
        '--connection-string',
        help='Database connection string (defaults to DATABASE_URL env var)',
        default=None
    )
    
    args = parser.parse_args()
    
    try:
        run_migrations(args.connection_string)
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

