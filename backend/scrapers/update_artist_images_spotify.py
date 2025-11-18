"""Script to fetch and update artist images from Spotify API."""

import requests
import os
import sys
from typing import Dict, Optional
from dotenv import load_dotenv
import time
import json
import base64

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import Database


class SpotifyAPI:
    """Client for Spotify API to fetch artist images."""
    
    def __init__(self, client_id: str = None, client_secret: str = None):
        self.client_id = client_id or os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('SPOTIFY_CLIENT_SECRET')
        
        if not self.client_id or not self.client_secret:
            raise ValueError("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env file")
        
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://api.spotify.com/v1"
    
    def get_access_token(self) -> str:
        """Get or refresh Spotify access token."""
        import time as time_module
        
        # Check if token is still valid (with 60 second buffer)
        if self.access_token and time_module.time() < self.token_expires_at - 60:
            return self.access_token
        
        # Request new token
        auth_url = "https://accounts.spotify.com/api/token"
        
        # Base64 encode client_id:client_secret
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "client_credentials"
        }
        
        response = requests.post(auth_url, headers=headers, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3600)
        self.token_expires_at = time_module.time() + expires_in
        
        return self.access_token
    
    def search_artist(self, artist_name: str) -> Optional[Dict]:
        """Search for an artist on Spotify."""
        token = self.get_access_token()
        
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        params = {
            "q": artist_name,
            "type": "artist",
            "limit": 1
        }
        
        response = requests.get(
            f"{self.base_url}/search",
            headers=headers,
            params=params
        )
        
        if response.status_code == 429:
            # Rate limited - wait and retry
            retry_after = int(response.headers.get('Retry-After', 5))
            print(f"  ⚠ Rate limited, waiting {retry_after} seconds...")
            time.sleep(retry_after)
            return self.search_artist(artist_name)
        
        response.raise_for_status()
        data = response.json()
        
        artists = data.get('artists', {}).get('items', [])
        if artists:
            return artists[0]
        
        return None
    
    def extract_image_url(self, artist_data: Dict) -> Optional[str]:
        """Extract the largest available image URL from Spotify artist data."""
        images = artist_data.get('images', [])
        
        if not images:
            return None
        
        # Spotify returns images sorted by size (largest first)
        # Get the largest image (first in the list)
        if len(images) > 0 and images[0].get('url'):
            return images[0]['url']
        
        return None


def update_artist_images():
    """Update all music artists in the database with their images from Spotify."""
    
    print("="*60)
    print("Spotify Artist Image Updater")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    try:
        spotify = SpotifyAPI()
        print("✓ Spotify API initialized")
    except ValueError as e:
        print(f"✗ Error: {e}")
        print("\nPlease set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file")
        return
    
    db = Database()
    print("✓ Database initialized\n")
    
    # Get all music artists
    print("2. Fetching all music artists from database...")
    artists = db.media.get_all_by_type('music', limit=10000)  # Get all artists
    print(f"✓ Found {len(artists)} artists in database\n")
    
    if len(artists) == 0:
        print("No artists found in database.")
        db.close()
        return
    
    # Process each artist
    print("3. Updating artist images...")
    updated_count = 0
    skipped_count = 0
    error_count = 0
    not_found_count = 0
    
    for i, artist in enumerate(artists, 1):
        try:
            artist_name = artist['title']
            item_id = artist['id']
            
            # Check if image already exists
            metadata = artist.get('metadata', {})
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except:
                    metadata = {}
            
            if metadata.get('image_url'):
                if i % 20 == 0:  # Only print every 20th skip to reduce noise
                    print(f"  ⊘ Skipping {artist_name} (already has image)")
                skipped_count += 1
                continue
            
            # Search for artist on Spotify
            artist_data = spotify.search_artist(artist_name)
            
            if not artist_data:
                if i % 20 == 0:  # Only print every 20th not found to reduce noise
                    print(f"  ⊘ Artist not found on Spotify: {artist_name}")
                not_found_count += 1
                skipped_count += 1
                continue
            
            # Extract image URL
            image_url = spotify.extract_image_url(artist_data)
            
            if image_url:
                # Update metadata
                db.media.update_metadata(item_id, {'image_url': image_url})
                print(f"  ✓ Updated {artist_name}: {image_url[:60]}...")
                updated_count += 1
            else:
                if i % 20 == 0:
                    print(f"  ⊘ No image found for {artist_name}")
                skipped_count += 1
            
            # Rate limiting (Spotify allows 30 requests per second, but be conservative)
            time.sleep(0.1)
            
            # Progress update
            if i % 10 == 0:
                print(f"\n  Progress: {i}/{len(artists)} artists processed")
                print(f"  Updated: {updated_count}, Skipped: {skipped_count}, Not Found: {not_found_count}, Errors: {error_count}\n")
        
        except Exception as e:
            error_msg = str(e)
            if 'rate limit' in error_msg.lower() or '429' in error_msg:
                print(f"  ⚠ Rate limit hit, waiting 5 seconds...")
                time.sleep(5)
                continue
            else:
                print(f"  ✗ Error processing {artist.get('title', 'Unknown')}: {e}")
                error_count += 1
                db.connection.rollback()
    
    print(f"\n✓ Update complete!")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Not Found on Spotify: {not_found_count}")
    print(f"  Errors: {error_count}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Image update complete!")
    print("="*60)


if __name__ == "__main__":
    update_artist_images()

