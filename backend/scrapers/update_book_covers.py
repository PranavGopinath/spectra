"""Script to update existing books in database with cover images from Google Books API."""

import os
import sys
from dotenv import load_dotenv
import time
import requests

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import Database
from scrapers.books import GoogleBooksScraper


def update_book_covers():
    """Update existing books in database with cover images."""
    
    print("="*60)
    print("Update Book Covers")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = GoogleBooksScraper()
    db = Database()
    print("✓ All components initialized\n")
    
    # Get all books without cover images
    print("2. Finding books without cover images...")
    all_books = db.media.get_all_by_type('book', limit=10000)
    
    books_to_update = []
    for book in all_books:
        metadata = book.get('metadata', {})
        # Check if book has no cover_url or image_url
        if not metadata.get('cover_url') and not metadata.get('image_url'):
            # Extract Google Books ID from item ID
            item_id = book.get('id', '')
            if item_id.startswith('book_google_'):
                google_id = item_id.replace('book_google_', '')
                books_to_update.append({
                    'item_id': item_id,
                    'google_id': google_id,
                    'title': book.get('title', 'Unknown')
                })
    
    print(f"✓ Found {len(books_to_update)} books without cover images\n")
    
    if len(books_to_update) == 0:
        print("No books need updating!")
        db.close()
        return
    
    # Update each book
    print(f"3. Updating {len(books_to_update)} books...")
    success_count = 0
    failed_count = 0
    
    for i, book_info in enumerate(books_to_update, 1):
        try:
            # Fetch book details from Google Books API by ID
            book_id = book_info['google_id']
            url = f"https://www.googleapis.com/books/v1/volumes/{book_id}"
            params = {}
            if scraper.api_key:
                params['key'] = scraper.api_key
            
            response = requests.get(url, params=params)
            if response.status_code != 200:
                print(f"  ⊘ No API data for: {book_info['title']}")
                failed_count += 1
                continue
            
            book = response.json()
            book_data = scraper.parse_book_data(book)
            
            # Get current metadata
            current_book = db.media.get_item_by_id(book_info['item_id'])
            if not current_book:
                print(f"  ⊘ Book not found: {book_info['title']}")
                failed_count += 1
                continue
            
            current_metadata = current_book.get('metadata', {})
            
            # Update metadata with cover image
            if book_data.get('cover_url'):
                current_metadata['cover_url'] = book_data['cover_url']
                current_metadata['image_url'] = book_data['image_url']
                if book_data.get('thumbnail'):
                    current_metadata['thumbnail'] = book_data['thumbnail']
                
                # Update in database
                db.media.update_metadata(book_info['item_id'], current_metadata)
                success_count += 1
                
                if i % 10 == 0:
                    print(f"  Updated {success_count}/{len(books_to_update)} books...")
            else:
                print(f"  ⊘ No cover image available for: {book_info['title']}")
                failed_count += 1
            
            time.sleep(0.3)  # Rate limiting
            
        except Exception as e:
            print(f"  ✗ Error updating {book_info['title']}: {e}")
            failed_count += 1
            db.connection.rollback()
    
    print(f"\n✓ Successfully updated {success_count} books")
    if failed_count > 0:
        print(f"  ⊘ Failed to update {failed_count} books")
    
    db.close()
    
    print("\n" + "="*60)
    print("Update complete!")
    print("="*60)


if __name__ == "__main__":
    update_book_covers()

