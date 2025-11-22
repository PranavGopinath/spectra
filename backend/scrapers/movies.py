"""Movie scraper for fetching data from TMDB API with improved scaling support."""

import requests
import os
import sys
import time
from typing import List, Dict, Optional, Set
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from taste_vector import TasteVectorEngine
from db import Database


class TMDBScraper:
    """Scraper for The Movie Database (TMDB) API with rate limiting and retry logic."""
    
    def __init__(self, api_key: str = None, rate_limit_delay: float = 0.25):
        self.api_key = api_key or os.getenv('TMDB_API_KEY')
        if not self.api_key:
            raise ValueError("TMDB_API_KEY not found. Get one at https://www.themoviedb.org/settings/api")
        
        self.base_url = "https://api.themoviedb.org/3"
        self.rate_limit_delay = rate_limit_delay  # Delay between API calls (seconds)
        self.session = requests.Session()
        self.session.headers.update({'Accept': 'application/json'})
    
    def _make_request(self, url: str, params: dict, max_retries: int = 3) -> requests.Response:
        """Make API request with retry logic and rate limiting."""
        params['api_key'] = self.api_key
        
        for attempt in range(max_retries):
            try:
                time.sleep(self.rate_limit_delay)  # Rate limiting
                response = self.session.get(url, params=params, timeout=30)
                
                # Handle rate limiting (429)
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 10))
                    print(f"  ⚠ Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                
                # Handle server errors (500, 502, 503, 504)
                if response.status_code >= 500:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt  # Exponential backoff
                        print(f"  ⚠ Server error {response.status_code}. Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"  ⚠ Timeout. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                raise
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"  ⚠ Request error: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                raise
        
        raise Exception(f"Failed after {max_retries} attempts")
    
    def fetch_popular_movies(self, pages: int = 5) -> List[Dict]:
        """Fetch popular movies across multiple pages."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/popular"
            params = {"page": page, "language": "en-US"}
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page}: {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_top_rated_movies(self, pages: int = 5) -> List[Dict]:
        """Fetch top-rated movies."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/top_rated"
            params = {"page": page, "language": "en-US"}
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page} (top rated): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_now_playing_movies(self, pages: int = 3) -> List[Dict]:
        """Fetch currently playing movies."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/now_playing"
            params = {"page": page, "language": "en-US"}
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page} (now playing): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_upcoming_movies(self, pages: int = 3) -> List[Dict]:
        """Fetch upcoming movies."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/movie/upcoming"
            params = {"page": page, "language": "en-US"}
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page} (upcoming): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_movies_by_genre(self, genre_id: int, pages: int = 3) -> List[Dict]:
        """Fetch movies by genre ID."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/discover/movie"
            params = {
                "page": page,
                "language": "en-US",
                "with_genres": genre_id,
                "sort_by": "popularity.desc"
            }
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page} (genre {genre_id}): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_movies_by_year(self, year: int, pages: int = 3) -> List[Dict]:
        """Fetch movies by release year."""
        movies = []
        
        for page in range(1, pages + 1):
            url = f"{self.base_url}/discover/movie"
            params = {
                "page": page,
                "language": "en-US",
                "primary_release_year": year,
                "sort_by": "popularity.desc"
            }
            
            response = self._make_request(url, params)
            data = response.json()
            movies.extend(data.get('results', []))
            print(f"  Fetched page {page} (year {year}): {len(data.get('results', []))} movies")
        
        return movies
    
    def fetch_movie_details(self, movie_id: int) -> Dict:
        """Fetch detailed information for a specific movie."""
        url = f"{self.base_url}/movie/{movie_id}"
        params = {"language": "en-US", "append_to_response": "keywords,credits"}
        
        response = self._make_request(url, params)
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


def fetch_and_store_movies(
    num_movies: int = 1000,
    use_diverse_sources: bool = True,
    resume_file: Optional[str] = None
):
    """
    Main function to fetch movies and store in database.
    
    Args:
        num_movies: Target number of movies to fetch
        use_diverse_sources: If True, fetch from multiple sources (genres, years, etc.)
        resume_file: Optional file path to track processed movie IDs for resume capability
    """
    
    print("="*60)
    print("TMDB Movie Scraper (Enhanced for Scaling)")
    print("="*60 + "\n")
    
    start_time = datetime.now()
    
    # Load processed movie IDs if resuming
    processed_ids: Set[int] = set()
    if resume_file and os.path.exists(resume_file):
        with open(resume_file, 'r') as f:
            processed_ids = {int(line.strip()) for line in f if line.strip()}
        print(f"📋 Resuming: {len(processed_ids)} movies already processed\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = TMDBScraper(rate_limit_delay=0.25)
    engine = TasteVectorEngine()
    db = Database()
    print("✓ All components initialized\n")
    
    # Check current database count
    existing_count = db.media.count_items('movie')
    print(f"📊 Current movies in database: {existing_count}\n")
    
    # Fetch movies from multiple sources for diversity
    print(f"2. Fetching movies from TMDB (target: {num_movies})...")
    all_movies = {}
    
    if use_diverse_sources:
        # Popular and top-rated (baseline)
        print("\n  Fetching popular movies...")
        popular = scraper.fetch_popular_movies(pages=10)  # More pages for larger dataset
        for m in popular:
            all_movies[m['id']] = m
        
        print("\n  Fetching top-rated movies...")
        top_rated = scraper.fetch_top_rated_movies(pages=10)
        for m in top_rated:
            all_movies[m['id']] = m
        
        # Now playing and upcoming (recent releases)
        print("\n  Fetching now playing movies...")
        now_playing = scraper.fetch_now_playing_movies(pages=3)
        for m in now_playing:
            all_movies[m['id']] = m
        
        print("\n  Fetching upcoming movies...")
        upcoming = scraper.fetch_upcoming_movies(pages=3)
        for m in upcoming:
            all_movies[m['id']] = m
        
        # Genre-based discovery (common genres)
        genre_ids = {
            28: "Action", 18: "Drama", 35: "Comedy", 27: "Horror",
            878: "Sci-Fi", 53: "Thriller", 80: "Crime", 10749: "Romance"
        }
        
        print("\n  Fetching movies by genre...")
        for genre_id, genre_name in genre_ids.items():
            try:
                genre_movies = scraper.fetch_movies_by_genre(genre_id, pages=2)
                for m in genre_movies:
                    all_movies[m['id']] = m
                print(f"    Added {len(genre_movies)} {genre_name} movies")
            except Exception as e:
                print(f"    ⚠ Error fetching {genre_name}: {e}")
        
        # Year-based discovery (diverse decades)
        print("\n  Fetching movies by year...")
        years = [2023, 2022, 2021, 2020, 2015, 2010, 2005, 2000, 1995, 1990]
        for year in years:
            try:
                year_movies = scraper.fetch_movies_by_year(year, pages=2)
                for m in year_movies:
                    all_movies[m['id']] = m
                print(f"    Added {len(year_movies)} movies from {year}")
            except Exception as e:
                print(f"    ⚠ Error fetching {year}: {e}")
    else:
        # Simple approach: just popular and top-rated
        popular = scraper.fetch_popular_movies(pages=20)
        top_rated = scraper.fetch_top_rated_movies(pages=20)
        for m in popular + top_rated:
            all_movies[m['id']] = m
    
    # Filter out already processed movies
    if processed_ids:
        all_movies = {k: v for k, v in all_movies.items() if k not in processed_ids}
    
    # Limit to target number
    movies = list(all_movies.values())[:num_movies]
    print(f"\n✓ Fetched {len(movies)} unique movies (after deduplication)\n")
    
    if len(movies) == 0:
        print("⚠ No new movies to process!")
        db.close()
        return
    
    # Process and store each movie
    print("3. Processing and storing movies...")
    success_count = 0
    error_count = 0
    duplicate_count = 0
    skip_count = 0
    
    for i, movie in enumerate(movies, 1):
        try:
            movie_id = movie['id']
            movie_title = movie.get('title', 'Unknown')
            
            # Skip if already processed
            if movie_id in processed_ids:
                skip_count += 1
                continue
            
            # Fetch full details
            details = scraper.fetch_movie_details(movie_id)
            
            # Skip if no overview/description
            if not details.get('overview') or len(details.get('overview', '')) < 50:
                print(f"  ⊘ Skipping {movie_title} (no description)")
                skip_count += 1
                continue
            
            # Build description for embedding
            description = scraper.build_movie_description(details)
            
            if not description or len(description) < 50:
                print(f"  ⊘ Skipping {movie_title} (insufficient description)")
                skip_count += 1
                continue
            
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
            
            # Track processed ID
            if resume_file:
                with open(resume_file, 'a') as f:
                    f.write(f"{movie_id}\n")
            
            # Progress updates
            if i % 10 == 0 or i == len(movies):
                elapsed = (datetime.now() - start_time).total_seconds()
                rate = success_count / elapsed if elapsed > 0 else 0
                remaining = (len(movies) - i) / rate if rate > 0 else 0
                print(f"  Progress: {i}/{len(movies)} ({i*100//len(movies)}%) | "
                      f"Success: {success_count} | Errors: {error_count} | "
                      f"ETA: {remaining/60:.1f} min")
        
        except Exception as e:
            error_msg = str(e).lower()
            error_count += 1
            
            # Handle duplicate key errors gracefully
            if 'duplicate key' in error_msg or 'unique constraint' in error_msg:
                db.connection.rollback()
                duplicate_count += 1
                print(f"  ⊘ Skipping {movie.get('title', 'Unknown')} (already exists)")
                
                # Track as processed even if duplicate
                if resume_file:
                    with open(resume_file, 'a') as f:
                        f.write(f"{movie.get('id', '')}\n")
            else:
                db.connection.rollback()
            print(f"  ✗ Error processing {movie.get('title', 'Unknown')}: {e}")
    
    elapsed_time = (datetime.now() - start_time).total_seconds()
    
    print(f"\n✓ Processing complete!")
    print(f"  Successfully stored: {success_count} movies")
    print(f"  Errors: {error_count}")
    print(f"  Duplicates skipped: {duplicate_count}")
    print(f"  Skipped (no description): {skip_count}")
    print(f"  Total time: {elapsed_time/60:.1f} minutes")
    print(f"  Average time per movie: {elapsed_time/success_count:.1f}s" if success_count > 0 else "")
    
    # Summary
    print("\n4. Database summary:")
    total = db.media.count_items('movie')
    print(f"  Total movies in database: {total}")
    print(f"  New movies added this run: {success_count}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Scraping complete!")
    print("="*60)
    
    if resume_file:
        print(f"\n💾 Resume file saved: {resume_file}")
        print("   Delete this file to start fresh next time")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape movies from TMDB')
    parser.add_argument('--count', type=int, default=1000, help='Number of movies to fetch (default: 1000)')
    parser.add_argument('--simple', action='store_true', help='Use simple fetching (only popular/top-rated)')
    parser.add_argument('--resume', type=str, help='Resume file path to track processed movies')
    
    args = parser.parse_args()
    
    fetch_and_store_movies(
        num_movies=args.count,
        use_diverse_sources=not args.simple,
        resume_file=args.resume or 'movies_processed.txt'
    )

