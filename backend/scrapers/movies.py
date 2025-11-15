"""Movie scraper for fetching data from TMDB API."""

import requests
import os
import sys
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from taste_vector import TasteVectorEngine
from db import Database


class TMDBScraper:
    """Scraper for The Movie Database (TMDB) API."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('TMDB_API_KEY')
        if not self.api_key:
            raise ValueError("TMDB_API_KEY not found. Get one at https://www.themoviedb.org/settings/api")
        
        self.base_url = "https://api.themoviedb.org/3"
    
    def fetch_popular_movies(self, pages: int = 5) -> List[Dict]:
        """Fetch popular movies across multiple pages."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/popular"
            params = {"api_key": self.api_key, "page": page, "language": "en-US"}
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"Fetched page {page}: {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_top_rated_movies(self, pages: int = 5) -> List[Dict]:
        """Fetch top-rated movies."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/top_rated"
            params = {"api_key": self.api_key, "page": page, "language": "en-US"}
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"Fetched page {page} (top rated): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_movie_details(self, movie_id: int) -> Dict:
        """Fetch detailed information for a specific movie."""
        url = f"{self.base_url}/movie/{movie_id}"
        params = {"api_key": self.api_key, "language": "en-US", "append_to_response": "keywords,credits"}
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def build_movie_description(self, movie: Dict) -> str:
        """Build a comprehensive text description for embedding."""
        parts = []
        
        if movie.get('overview'):
            parts.append(movie['overview'])
        
        if movie.get('genres'):
            genres = ', '.join([g['name'] for g in movie['genres']])
            parts.append(f"Genres: {genres}")
        
        if movie.get('keywords', {}).get('keywords'):
            keywords = ', '.join([k['name'] for k in movie['keywords']['keywords'][:10]])
            parts.append(f"Keywords: {keywords}")
        
        return '. '.join(parts)


def fetch_and_store_movies(num_movies: int = 250):
    """Main function to fetch movies and store in database."""
    
    print("="*60)
    print("TMDB Movie Scraper")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = TMDBScraper()
    engine = TasteVectorEngine()
    db = Database()
    print("✓ All components initialized\n")
    
    # Fetch movies
    print(f"2. Fetching {num_movies} movies from TMDB...")
    popular = scraper.fetch_popular_movies(pages=5)
    top_rated = scraper.fetch_top_rated_movies(pages=5)
    
    # Combine and deduplicate
    all_movies = {m['id']: m for m in popular + top_rated}
    movies = list(all_movies.values())[:num_movies]
    print(f"✓ Fetched {len(movies)} unique movies\n")
    
    # Process and store each movie
    print("3. Processing and storing movies...")
    success_count = 0
    
    for i, movie in enumerate(movies, 1):
        try:
            # Fetch full details
            details = scraper.fetch_movie_details(movie['id'])
            
            # Build description for embedding
            description = scraper.build_movie_description(details)
            
            # Generate embeddings and taste vectors
            embedding = engine.embed(description)
            taste_vector = engine.project(embedding)
            
            # Prepare metadata
            metadata = {
                'director': next(
                    (c['name'] for c in details.get('credits', {}).get('crew', []) 
                     if c['job'] == 'Director'), 
                    None
                ),
                'genres': [g['name'] for g in details.get('genres', [])],
                'poster_url': f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get('poster_path') else None,
                'tmdb_rating': details.get('vote_average'),
                'tmdb_id': details['id']
            }
            
            # Insert into database
            item = {
                'id': f"movie_tmdb_{details['id']}",
                'title': details['title'],
                'media_type': 'movie',
                'year': int(details['release_date'][:4]) if details.get('release_date') else None,
                'description': description,
                'metadata': metadata,
                'embedding': embedding,
                'taste_vector': taste_vector
            }
            
            db.media.insert_item(item)
            success_count += 1
            
            if i % 10 == 0:
                print(f"  Processed {i}/{len(movies)} movies...")
        
        except Exception as e:
            print(f"  ✗ Error processing {movie.get('title', 'Unknown')}: {e}")
    
    print(f"\n✓ Successfully stored {success_count}/{len(movies)} movies")
    
    # Summary
    print("\n4. Database summary:")
    total = db.media.count_items('movie')
    print(f"  Total movies in database: {total}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Scraping complete!")
    print("="*60)


if __name__ == "__main__":
    fetch_and_store_movies(num_movies=250)

