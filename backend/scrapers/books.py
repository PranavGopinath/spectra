"""Books scraper for fetching data from Google Books API."""

import requests
import os
import sys
from typing import List, Dict
from dotenv import load_dotenv
import time

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from taste_vector import TasteVectorEngine
from db import Database


class GoogleBooksScraper:
    """Scraper for Google Books API."""
    
    def __init__(self, api_key: str = None):
        # API key is optional for Google Books but increases rate limits
        self.api_key = api_key or os.getenv('GOOGLE_BOOKS_API_KEY')
        self.base_url = "https://www.googleapis.com/books/v1/volumes"
    
    def search_books(self, query: str, max_results: int = 40) -> List[Dict]:
        """Search for books by query."""
        params = {
            'q': query,
            'maxResults': max_results,
            'printType': 'books',
            'langRestrict': 'en'
        }
        
        if self.api_key:
            params['key'] = self.api_key
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('items', [])
    
    def fetch_books_by_genre(self, genre: str, limit: int = 30) -> List[Dict]:
        """Fetch popular books in a specific genre."""
        # Search for highly rated books in the genre
        query = f'subject:{genre}'
        
        params = {
            'q': query,
            'maxResults': limit,
            'orderBy': 'relevance',
            'printType': 'books',
            'langRestrict': 'en'
        }
        
        if self.api_key:
            params['key'] = self.api_key
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('items', [])
    
    def build_book_description(self, book: Dict) -> str:
        """Build a comprehensive text description for embedding."""
        volume_info = book.get('volumeInfo', {})
        parts = []
        
        # Description/synopsis
        description = volume_info.get('description', '')
        if description:
            # Limit to first 1500 characters to keep it manageable
            parts.append(description[:1500])
        
        # Categories/genres
        categories = volume_info.get('categories', [])
        if categories:
            parts.append(f"Categories: {', '.join(categories)}")
        
        # Authors
        authors = volume_info.get('authors', [])
        if authors:
            parts.append(f"By {', '.join(authors)}")
        
        return '. '.join(parts) if parts else f"Book: {volume_info.get('title', 'Unknown')}"
    
    def get_best_cover_image(self, image_links: Dict) -> str:
        """Get the best available cover image URL from Google Books imageLinks."""
        if not image_links:
            return None
        
        # Prefer larger images, fallback to smaller ones
        # Google Books provides: smallThumbnail, thumbnail, small, medium, large, extraLarge
        for size in ['large', 'medium', 'small', 'thumbnail', 'smallThumbnail']:
            image_url = image_links.get(size)
            if image_url:
                # Google Books URLs sometimes have http://, convert to https://
                # Also remove any size restrictions in the URL
                image_url = image_url.replace('http://', 'https://')
                # Remove zoom parameter if present to get original size
                image_url = image_url.split('&zoom=')[0].split('?zoom=')[0]
                return image_url
        
        return None
    
    def parse_book_data(self, book: Dict) -> Dict:
        """Extract relevant data from Google Books API response."""
        volume_info = book.get('volumeInfo', {})
        
        # Extract year from publishedDate
        year = None
        published_date = volume_info.get('publishedDate', '')
        if published_date:
            try:
                year = int(published_date.split('-')[0])
            except (ValueError, IndexError):
                pass
        
        # Get best available cover image
        image_links = volume_info.get('imageLinks', {})
        cover_url = self.get_best_cover_image(image_links)
        
        return {
            'google_id': book.get('id'),
            'title': volume_info.get('title', 'Unknown'),
            'authors': volume_info.get('authors', []),
            'description': volume_info.get('description', ''),
            'categories': volume_info.get('categories', []),
            'year': year,
            'page_count': volume_info.get('pageCount'),
            'language': volume_info.get('language', 'en'),
            'average_rating': volume_info.get('averageRating'),
            'ratings_count': volume_info.get('ratingsCount'),
            'thumbnail': image_links.get('thumbnail'),  # Keep for backwards compatibility
            'cover_url': cover_url,  # Best quality cover image
            'image_url': cover_url,  # Also store as image_url for frontend compatibility
            'preview_link': volume_info.get('previewLink')
        }


def fetch_and_store_books(num_books: int = 250):
    """Main function to fetch books and store in database."""
    
    print("="*60)
    print("Google Books Scraper")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = GoogleBooksScraper()
    engine = TasteVectorEngine()
    db = Database()
    print("✓ All components initialized\n")
    
    # Define diverse genres to fetch from
    genres = [
        'fiction', 'mystery', 'thriller', 'science fiction', 'fantasy',
        'romance', 'historical fiction', 'literary fiction', 'horror',
        'poetry', 'philosophy', 'psychology', 'biography', 'history',
        'science', 'self help', 'business', 'classics', 'contemporary'
    ]
    
    # Fetch books from each genre
    print(f"2. Fetching books from {len(genres)} genres...")
    all_books = {}
    
    for genre in genres:
        try:
            books = scraper.fetch_books_by_genre(genre, limit=20)
            for book in books:
                google_id = book.get('id')
                if google_id:
                    all_books[google_id] = book
            print(f"  + Fetched from '{genre}': {len(books)} books")
            time.sleep(0.5)  # Rate limiting
        except Exception as e:
            print(f"  ✗ Error fetching {genre}: {e}")
    
    books = list(all_books.values())[:num_books]
    print(f"✓ Total unique books: {len(books)}\n")
    
    # Process and store each book
    print("3. Processing and storing books...")
    success_count = 0
    
    for i, book in enumerate(books, 1):
        try:
            # Parse book data
            book_data = scraper.parse_book_data(book)
            
            # Skip if no description
            if not book_data['description'] or len(book_data['description']) < 50:
                print(f"  ⊘ Skipping {book_data['title']} (no description)")
                continue
            
            # Build description for embedding
            description = scraper.build_book_description(book)
            
            # Generate embeddings and taste vectors
            embedding = engine.embed(description)
            taste_vector = engine.project(embedding)
            
            # Prepare metadata
            metadata = {
                'authors': book_data['authors'],
                'categories': book_data['categories'],
                'page_count': book_data['page_count'],
                'language': book_data['language'],
                'average_rating': book_data['average_rating'],
                'ratings_count': book_data['ratings_count'],
                'thumbnail': book_data['thumbnail'],  # Keep for backwards compatibility
                'cover_url': book_data['cover_url'],  # Best quality cover
                'image_url': book_data['image_url'],  # Also as image_url for frontend
                'preview_link': book_data['preview_link'],
                'google_id': book_data['google_id']
            }
            
            # Insert into database
            item = {
                'id': f"book_google_{book_data['google_id']}",
                'title': book_data['title'],
                'media_type': 'book',
                'year': book_data['year'],
                'description': description,
                'metadata': metadata,
                'embedding': embedding,
                'taste_vector': taste_vector
            }
            
            db.media.insert_item(item)
            success_count += 1
            
            if i % 10 == 0:
                print(f"  Processed {success_count}/{len(books)} books...")
            
            time.sleep(0.3)  # Rate limiting
        
        except Exception as e:
            error_msg = str(e)
            if 'duplicate key' in error_msg:
                db.connection.rollback()
                book_data = scraper.parse_book_data(book)
                print(f"  ⊘ Skipping {book_data['title']} (already exists)")
            else:
                db.connection.rollback()
                book_data = scraper.parse_book_data(book)
                print(f"  ✗ Error processing {book_data['title']}: {e}")
    
    print(f"\n✓ Successfully stored {success_count}/{len(books)} books")
    
    # Summary
    print("\n4. Database summary:")
    total = db.media.count_items('book')
    print(f"  Total books in database: {total}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Scraping complete!")
    print("="*60)


if __name__ == "__main__":
    fetch_and_store_books(num_books=250)

