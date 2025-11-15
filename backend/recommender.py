"""Core recommendation engine for Spectra."""

import numpy as np
from typing import List, Dict, Optional, Union
from taste_vector import TasteVectorEngine
from db import Database
from taste_dimensions import TASTE_DIMENSIONS


class SpectraRecommender:
    """Main recommendation engine combining taste analysis and retrieval."""
    
    def __init__(self):
        self.engine = TasteVectorEngine()
        self.db = Database()
        self.dimension_names = [d['name'] for d in TASTE_DIMENSIONS]
    
    def analyze_taste(self, text: str) -> Dict:
        """Analyze user's taste from text input."""
        taste_vector = self.engine.text_to_taste_vector(text)
        
        # Break down by dimension
        breakdown = []
        for i, (name, score) in enumerate(zip(self.dimension_names, taste_vector)):
            dimension = TASTE_DIMENSIONS[i]
            
            # Interpret the score
            if score > 0.1:
                tendency = dimension['positive_prompt'].split('.')[0]
            elif score < -0.1:
                tendency = dimension['negative_prompt'].split('.')[0]
            else:
                tendency = "Balanced"
            
            breakdown.append({
                'dimension': name,
                'score': float(score),
                'tendency': tendency,
                'description': dimension['description']
            })
        
        return {
            'taste_vector': taste_vector.tolist(),
            'breakdown': breakdown
        }
    
    def recommend(
        self,
        query: Union[str, np.ndarray, List[float]],
        media_types: Optional[List[str]] = None,
        top_k: int = 10,
        min_year: Optional[int] = None,
        max_year: Optional[int] = None
    ) -> Dict[str, List[Dict]]:
        """
        Get recommendations based on taste query.
        
        Args:
            query: User text, taste vector, or list of floats
            media_types: List of media types to search (None = all)
            top_k: Number of recommendations per media type
            min_year: Filter by minimum year
            max_year: Filter by maximum year
        
        Returns:
            Dict mapping media types to lists of recommendations
        """
        # Convert query to taste vector if needed
        if isinstance(query, str):
            taste_vector = self.engine.text_to_taste_vector(query)
        elif isinstance(query, list):
            taste_vector = np.array(query)
        else:
            taste_vector = query
        
        # Default to all media types if not specified
        if media_types is None:
            media_types = ['movie', 'music', 'book']
        
        results = {}
        
        for media_type in media_types:
            # Search database
            items = self.db.media.search_by_taste(
                taste_vector=taste_vector,
                media_type=media_type,
                limit=top_k * 2  # Get extra for filtering
            )
            
            # Apply year filtering if specified
            if min_year or max_year:
                filtered = []
                for item in items:
                    year = item.get('year')
                    if year:
                        if min_year and year < min_year:
                            continue
                        if max_year and year > max_year:
                            continue
                    filtered.append(item)
                items = filtered
            
            # Limit to top_k
            items = items[:top_k]
            
            # Format results
            formatted = []
            for item in items:
                formatted.append({
                    'id': item['id'],
                    'title': item['title'],
                    'media_type': item['media_type'],
                    'year': item['year'],
                    'description': item['description'][:200] + '...' if len(item.get('description', '')) > 200 else item.get('description', ''),
                    'metadata': item.get('metadata', {}),
                    'similarity': item['similarity']
                })
            
            results[media_type] = formatted
        
        return results
    
    def find_similar(
        self,
        item_id: str,
        media_types: Optional[List[str]] = None,
        top_k: int = 10,
        exclude_same_item: bool = True
    ) -> Dict[str, List[Dict]]:
        """Find items similar to a given item (cross-domain discovery)."""
        # Get the source item
        source_item = self.db.media.get_item_by_id(item_id)
        if not source_item:
            raise ValueError(f"Item {item_id} not found")
        
        taste_vector = source_item['taste_vector']
        
        # Get recommendations
        results = self.recommend(
            query=taste_vector,
            media_types=media_types,
            top_k=top_k + 1 if exclude_same_item else top_k
        )
        
        # Remove the source item from results if requested
        if exclude_same_item:
            for media_type, items in results.items():
                results[media_type] = [
                    item for item in items 
                    if item['id'] != item_id
                ][:top_k]
        
        return results
    
    def explain_match(
        self,
        item_id: str,
        user_taste_vector: Union[np.ndarray, List[float]]
    ) -> Dict:
        """Explain why an item matches the user's taste."""
        item = self.db.media.get_item_by_id(item_id)
        if not item:
            raise ValueError(f"Item {item_id} not found")
        
        item_taste_vector = np.array(item['taste_vector'])
        user_taste_vector = np.array(user_taste_vector)
        
        # Calculate overall similarity
        similarity = float(np.dot(user_taste_vector, item_taste_vector) / 
                          (np.linalg.norm(user_taste_vector) * np.linalg.norm(item_taste_vector)))
        
        # Calculate contribution of each dimension
        dimension_matches = []
        for i, name in enumerate(self.dimension_names):
            user_score = float(user_taste_vector[i])
            item_score = float(item_taste_vector[i])
            
            # How much this dimension contributes to the match
            contribution = user_score * item_score
            
            dimension_matches.append({
                'dimension': name,
                'user_score': user_score,
                'item_score': item_score,
                'contribution': contribution,
                'aligned': contribution > 0
            })
        
        # Sort by absolute contribution
        dimension_matches.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        # Generate natural language explanation
        top_matches = [d for d in dimension_matches[:3] if d['aligned']]
        explanation_parts = []
        
        for match in top_matches:
            dim = TASTE_DIMENSIONS[self.dimension_names.index(match['dimension'])]
            if match['user_score'] > 0 and match['item_score'] > 0:
                explanation_parts.append(f"Both lean towards {match['dimension'].lower()}: {dim['positive_prompt'].split('.')[0].lower()}")
            elif match['user_score'] < 0 and match['item_score'] < 0:
                explanation_parts.append(f"Both lean towards {match['dimension'].lower()}: {dim['negative_prompt'].split('.')[0].lower()}")
        
        explanation = ". ".join(explanation_parts) if explanation_parts else "General aesthetic alignment"
        
        return {
            'item': {
                'id': item['id'],
                'title': item['title'],
                'media_type': item['media_type']
            },
            'overall_similarity': similarity,
            'dimension_matches': dimension_matches,
            'explanation': explanation
        }
    
    def close(self):
        """Close database connection."""
        self.db.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

