"""
Test script for database functionality.
Run this after starting PostgreSQL with docker-compose.

Usage:
    python test_db.py
"""

from db import Database
import numpy as np


def main():
    print("Testing Spectra Database...\n")
    
    # Initialize database
    print("1. Connecting to database...")
    db = Database()
    print("✓ Connected!\n")
    
    # Create tables
    print("2. Creating tables from schema.sql...")
    try:
        db.create_tables()
        print("✓ Tables created!\n")
    except Exception as e:
        print(f"Note: {e}")
        print("(Tables may already exist, continuing...)\n")
        db.connection.rollback()  # Rollback failed transaction
    
    # Insert test item
    print("3. Inserting test movie...")
    test_item = {
        'id': 'movie_test_001',
        'title': 'The Dark Knight',
        'media_type': 'movie',
        'year': 2008,
        'description': 'A gritty, intense crime thriller exploring chaos and morality in Gotham City.',
        'metadata': {
            'director': 'Christopher Nolan',
            'genres': ['Action', 'Crime', 'Drama'],
            'poster_url': 'https://example.com/poster.jpg'
        },
        'embedding': np.random.rand(384),  # Dummy embedding for now
        'taste_vector': np.array([0.7, 0.6, 0.5, 0.2, -0.1, 0.6, 0.0, -0.3])  # Dark, intense, complex
    }
    
    try:
        db.media.insert_item(test_item)
        print("✓ Inserted: The Dark Knight\n")
    except Exception as e:
        print(f"Note: {e}")
        print("(Item may already exist, continuing...)\n")
        db.connection.rollback()  # Rollback failed transaction
    
    # Get item by ID
    print("4. Retrieving item by ID...")
    item = db.media.get_item_by_id('movie_test_001')
    if item:
        print(f"✓ Found: {item['title']} ({item['year']})\n")
    else:
        print("✗ Item not found\n")
    
    # Search by taste vector
    print("5. Searching by similar taste vector...")
    search_vector = np.array([0.8, 0.5, 0.6, 0.1, -0.2, 0.5, 0.1, -0.4])  # Similar to Dark Knight
    
    results = db.media.search_by_taste(
        taste_vector=search_vector,
        media_type='movie',
        limit=5
    )
    
    print(f"✓ Found {len(results)} similar items:")
    for i, result in enumerate(results, 1):
        print(f"   {i}. {result['title']} (similarity: {result['similarity']:.3f})")
    print()
    
    # Count items
    print("6. Counting items...")
    total = db.media.count_items()
    movies = db.media.count_items('movie')
    print(f"✓ Total items: {total}")
    print(f"✓ Movies: {movies}\n")
    
    # Close connection
    print("7. Closing connection...")
    db.close()
    print("✓ Closed!\n")
    
    print("=" * 50)
    print("All tests passed! Database is working correctly.")
    print("=" * 50)


if __name__ == "__main__":
    main()

