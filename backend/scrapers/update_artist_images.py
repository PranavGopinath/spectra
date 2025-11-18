"""Script to fetch and update artist images from Last.fm API."""

import requests
import os
import sys
from typing import Dict, Optional
from dotenv import load_dotenv
import time
import json

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import Database


class LastFMScraper:
    """Scraper for Last.fm API to fetch artist images."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('LASTFM_API_KEY')
        if not self.api_key:
            raise ValueError("LASTFM_API_KEY not found. Get one at https://www.last.fm/api/account/create")
        
        self.base_url = "http://ws.audioscrobbler.com/2.0/"
    
    def fetch_artist_info(self, artist_name: str) -> Dict:
        """Fetch detailed artist information including images."""
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
    
    def extract_image_url(self, artist_info: Dict) -> Optional[str]:
        """Extract the largest available image URL from artist info."""
        images = artist_info.get('image', [])
        
        if not images:
            return None
        
        # Last.fm returns images in order: small, medium, large, extralarge, mega
        # We want the largest NON-PLACEHOLDER image available
        size_preference = ['mega', 'extralarge', 'large', 'medium', 'small']
        
        # First pass: find largest non-placeholder image
        for size in size_preference:
            for img in images:
                if isinstance(img, dict):
                    url = img.get('#text') or img.get('text') or img.get('url', '')
                    img_size = img.get('size', '')
                    
                    if url and img_size == size and len(url) > 10:
                        # Skip placeholder images (Last.fm uses a specific placeholder hash)
                        # Also check for empty or very short URLs
                        if '2a96cbd8b46e442fc41c2b86b821562f' not in url:
                            # Verify it's a real URL
                            if url.startswith('http') and 'lastfm.freetls.fastly.net' in url:
                                return url
        
        return None


def update_artist_images():
    """Update all music artists in the database with their images from Last.fm."""
    
    print("="*60)
    print("Last.fm Artist Image Updater")
    print("="*60 + "\n")
    
    # Initialize components
    print("1. Initializing components...")
    scraper = LastFMScraper()
    db = Database()
    print("✓ All components initialized\n")
    
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
                print(f"  ⊘ Skipping {artist_name} (already has image)")
                skipped_count += 1
                continue
            
            # Fetch artist info from Last.fm
            artist_info = scraper.fetch_artist_info(artist_name)
            
            # Debug: print first few to see all image sizes
            if i <= 3:
                print(f"  Debug - Artist info for {artist_name}:")
                if 'image' in artist_info and isinstance(artist_info['image'], list):
                    print(f"    All images:")
                    for img in artist_info['image']:
                        url = img.get('#text', '')
                        size = img.get('size', '')
                        is_placeholder = '2a96cbd8b46e442fc41c2b86b821562f' in url if url else True
                        print(f"      {size}: {url[:60]}... (placeholder: {is_placeholder})")
            
            # Extract image URL
            image_url = scraper.extract_image_url(artist_info)
            
            if image_url:
                # Update metadata
                db.media.update_metadata(item_id, {'image_url': image_url})
                print(f"  ✓ Updated {artist_name}: {image_url[:50]}...")
                updated_count += 1
            else:
                print(f"  ⊘ No image found for {artist_name}")
                skipped_count += 1
            
            # Rate limiting
            time.sleep(0.25)
            
            # Progress update
            if i % 10 == 0:
                print(f"\n  Progress: {i}/{len(artists)} artists processed")
                print(f"  Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}\n")
        
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
    print(f"  Errors: {error_count}")
    
    db.close()
    
    print("\n" + "="*60)
    print("Image update complete!")
    print("="*60)


if __name__ == "__main__":
    update_artist_images()

