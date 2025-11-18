"""Music scraper for fetching data from Last.fm API."""

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


class LastFMScraper:
    """Scraper for Last.fm API to fetch artists and albums."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('LASTFM_API_KEY')
        if not self.api_key:
            raise ValueError("LASTFM_API_KEY not found. Get one at https://www.last.fm/api/account/create")
        
        self.base_url = "http://ws.audioscrobbler.com/2.0/"
    
    def fetch_top_artists(self, limit: int = 100) -> List[Dict]:
        """Fetch top artists from Last.fm charts."""
        artists = []
        page = 1
        per_page = 50
        
        while len(artists) < limit:
            params = {
                'method': 'chart.gettopartists',
                'api_key': self.api_key,
                'format': 'json',
                'limit': per_page,
                'page': page
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            artist_list = data.get('artists', {}).get('artist', [])
            
            if not artist_list:
                break
            
            artists.extend(artist_list)
            print(f"Fetched page {page}: {len(artist_list)} artists")
            page += 1
            time.sleep(0.2)  # Rate limiting
            
            if len(artist_list) < per_page:
                break
        
        return artists[:limit]
    
    def fetch_artist_info(self, artist_name: str) -> Dict:
        """Fetch detailed artist information including bio."""
        params = {
            'method': 'artist.getinfo',
            'artist': artist_name,
            'api_key': self.api_key,
            'format': 'json'
        }
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('artist', {})
    
    def fetch_artist_top_albums(self, artist_name: str, limit: int = 3) -> List[Dict]:
        """Fetch top albums for an artist."""
        params = {
            'method': 'artist.gettopalbums',
            'artist': artist_name,
            'api_key': self.api_key,
            'format': 'json',
            'limit': limit
        }
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('topalbums', {}).get('album', [])
    
    def fetch_top_tags(self, limit: int = 50) -> List[str]:
        """Fetch popular music tags/genres."""
        params = {
            'method': 'chart.gettoptags',
            'api_key': self.api_key,
            'format': 'json',
            'limit': limit
        }
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        tags = data.get('tags', {}).get('tag', [])
        return [tag['name'] for tag in tags]
    
    def fetch_tag_top_artists(self, tag: str, limit: int = 30) -> List[Dict]:
        """Fetch top artists for a specific tag/genre."""
        params = {
            'method': 'tag.gettopartists',
            'tag': tag,
            'api_key': self.api_key,
            'format': 'json',
            'limit': limit
        }
        
        response = requests.get(self.base_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get('topartists', {}).get('artist', [])
    
    def build_artist_description(self, artist_info: Dict, albums: List[Dict] = None) -> str:
        """Build a comprehensive text description for embedding."""
        parts = []
        
        # Artist bio (clean up the Last.fm formatting)
        bio = artist_info.get('bio', {}).get('summary', '')
        if bio:
            # Remove Last.fm link footer
            bio = bio.split('<a href')[0].strip()
            bio = bio.replace('\n', ' ')
            parts.append(bio)
        
        # Artist tags/genres
        tags = artist_info.get('tags', {}).get('tag', [])
        if tags:
            tag_names = ', '.join([t['name'] for t in tags[:8]])
            parts.append(f"Genres and styles: {tag_names}")
        
        # Top albums
        if albums:
            album_names = ', '.join([a['name'] for a in albums[:3]])
            parts.append(f"Notable albums: {album_names}")
        
        return '. '.join(parts) if parts else f"Artist: {artist_info.get('name', 'Unknown')}"


def fetch_and_store_music(num_artists: int = 250):
    """Main function to fetch music and store in database."""
    
    print("="*60)
    print("Last.fm Music Scraper")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = LastFMScraper()
    engine = TasteVectorEngine()
    db = Database()
    print("✓ All components initialized\n")
    
    # Fetch diverse set of artists
    print(f"2. Fetching {num_artists} artists from Last.fm...")
    
    # Get top artists
    top_artists = scraper.fetch_top_artists(limit=150)
    print(f"✓ Fetched {len(top_artists)} top artists")
    
    # Get artists from diverse genres
    print("Fetching artists from diverse genres...")
    genres = ['rock', 'jazz', 'electronic', 'classical', 'hip hop', 'indie', 'metal', 'folk']
    genre_artists = []
    
    for genre in genres:
        try:
            artists = scraper.fetch_tag_top_artists(genre, limit=15)
            genre_artists.extend(artists)
            print(f"  + {len(artists)} {genre} artists")
            time.sleep(0.3)
        except Exception as e:
            print(f"  ✗ Error fetching {genre}: {e}")
    
    # Combine and deduplicate by name
    all_artists = {a['name']: a for a in top_artists + genre_artists}
    artists = list(all_artists.values())[:num_artists]
    print(f"✓ Total unique artists: {len(artists)}\n")
    
    # Process and store each artist
    print("3. Processing and storing artists...")
    success_count = 0
    
    for i, artist in enumerate(artists, 1):
        try:
            artist_name = artist['name']
            
            # Fetch full artist info
            artist_info = scraper.fetch_artist_info(artist_name)
            
            # Skip if no bio
            if not artist_info.get('bio', {}).get('summary'):
                print(f"  ⊘ Skipping {artist_name} (no bio)")
                continue
            
            # Fetch top albums
            albums = scraper.fetch_artist_top_albums(artist_name, limit=3)
            
            # Build description
            description = scraper.build_artist_description(artist_info, albums)
            
            # Generate embeddings and taste vectors
            embedding = engine.embed(description)
            taste_vector = engine.project(embedding)
            
            # Prepare metadata
            tags = artist_info.get('tags', {}).get('tag', [])
            
            # Extract image URL (prefer largest available)
            image_url = None
            images = artist_info.get('image', [])
            if images:
                size_preference = ['mega', 'extralarge', 'large', 'medium', 'small']
                for size in size_preference:
                    for img in images:
                        if img.get('size') == size and img.get('#text'):
                            url = img['#text']
                            # Skip placeholder images
                            if url and '2a96cbd8b46e442fc41c2b86b821562f' not in url:
                                image_url = url
                                break
                    if image_url:
                        break
            
            metadata = {
                'genres': [t['name'] for t in tags[:5]],
                'listeners': int(artist_info.get('stats', {}).get('listeners', 0)),
                'playcount': int(artist_info.get('stats', {}).get('playcount', 0)),
                'lastfm_url': artist_info.get('url'),
                'top_albums': [a['name'] for a in albums[:3]],
                'mbid': artist_info.get('mbid')
            }
            
            if image_url:
                metadata['image_url'] = image_url
            
            # Insert into database
            item = {
                'id': f"music_lastfm_{artist_info.get('mbid', artist_name.lower().replace(' ', '_'))}",
                'title': artist_name,
                'media_type': 'music',
                'year': None,  # Last.fm doesn't provide formation year consistently
                'description': description,
                'metadata': metadata,
                'embedding': embedding,
                'taste_vector': taste_vector
            }
            
            db.media.insert_item(item)
            success_count += 1
            
            if i % 10 == 0:
                print(f"  Processed {success_count}/{len(artists)} artists...")
            
            time.sleep(0.25)  # Rate limiting
        
        except Exception as e:
            error_msg = str(e)
            if 'duplicate key' in error_msg:
                db.connection.rollback()
                print(f"  ⊘ Skipping {artist.get('name', 'Unknown')} (already exists)")
            else:
                db.connection.rollback()
                print(f"  ✗ Error processing {artist.get('name', 'Unknown')}: {e}")
    
    print(f"\n✓ Successfully stored {success_count}/{len(artists)} artists")
    
    # Summary
    print("\n4. Database summary:")
    total = db.media.count_items('music')
    print(f"  Total music artists in database: {total}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Scraping complete!")
    print("="*60)


if __name__ == "__main__":
    fetch_and_store_music(num_artists=250)

