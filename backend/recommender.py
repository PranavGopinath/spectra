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
            query: User text (uses 384D embedding), taste vector (8D), or list of floats
            media_types: List of media types to search (None = all)
            top_k: Number of recommendations per media type
            min_year: Filter by minimum year
            max_year: Filter by maximum year
        
        Returns:
            Dict mapping media types to lists of recommendations
        """
        # Default to all media types if not specified
        if media_types is None:
            media_types = ['movie', 'music', 'book']
        
        results = {}
        
        # If query is text, use 384D embedding for semantic similarity search
        # If query is already a vector/list, determine if it's 8D (taste) or 384D (embedding)
        use_embedding_search = False
        search_vector = None
        
        if isinstance(query, str):
            # Text query: use 384D embedding for better semantic matching
            embedding_384d = self.engine.embed(query)
            use_embedding_search = True
            search_vector = embedding_384d
        elif isinstance(query, list):
            search_vector = np.array(query)
            # Heuristic: if length is 8, assume it's a taste vector; if 384, assume embedding
            use_embedding_search = len(search_vector) == 384
        else:
            # numpy array
            search_vector = query
            use_embedding_search = len(search_vector) == 384
        
        for media_type in media_types:
            # Search database using appropriate method
            if use_embedding_search:
                # Use 384D embedding search for semantic similarity
                items = self.db.media.search_by_embedding(
                    embedding=search_vector,
                    media_type=media_type,
                    limit=top_k * 2  # Get extra for filtering
                )
            else:
                # Use 8D taste vector search
                items = self.db.media.search_by_taste(
                    taste_vector=search_vector,
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
    
    def compute_user_taste_profile(self, user_id: str) -> Optional[Dict]:
        """
        Compute user's taste profile from their ratings.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with embedding_384d, taste_vector_8d, breakdown, and num_ratings
            Returns None if user has no ratings
        """
        ratings = self.db.user.get_user_ratings_with_embeddings(user_id)
        
        if not ratings:
            return None
        
        # Convert embeddings to numpy arrays and weight by rating
        weights = np.array([r['rating'] for r in ratings])
        embeddings_384d = []
        taste_vectors_8d = []
        
        for r in ratings:
            # Handle different embedding formats (list, numpy array, pgvector type)
            embedding = r['embedding']
            if isinstance(embedding, (list, tuple)):
                embedding = np.array(embedding)
            elif hasattr(embedding, 'tolist'):
                embedding = np.array(embedding.tolist())
            
            taste_vector = r['taste_vector']
            if isinstance(taste_vector, (list, tuple)):
                taste_vector = np.array(taste_vector)
            elif hasattr(taste_vector, 'tolist'):
                taste_vector = np.array(taste_vector.tolist())
            
            embeddings_384d.append(embedding)
            taste_vectors_8d.append(taste_vector)
        
        embeddings_384d = np.array(embeddings_384d)
        taste_vectors_8d = np.array(taste_vectors_8d)
        
        # Weighted average (higher ratings = more influence)
        weighted_embedding = np.average(embeddings_384d, axis=0, weights=weights)
        weighted_taste_vector = np.average(taste_vectors_8d, axis=0, weights=weights)
        
        # Breakdown by dimension
        breakdown = []
        for i, (name, score) in enumerate(zip(self.dimension_names, weighted_taste_vector)):
            dimension = TASTE_DIMENSIONS[i]
            
            if score > 0.1:
                tendency = dimension['positive_label']
            elif score < -0.1:
                tendency = dimension['negative_label']
            else:
                tendency = "Balanced"
            
            breakdown.append({
                'dimension': name,
                'score': float(score),
                'tendency': tendency,
                'description': dimension['description']
            })
        
        return {
            'embedding_384d': weighted_embedding,
            'taste_vector_8d': weighted_taste_vector,
            'breakdown': breakdown,
            'num_ratings': len(ratings)
        }
    
    def recommend_for_user(
        self,
        user_id: str,
        media_types: Optional[List[str]] = None,
        top_k: int = 10,
        exclude_rated: bool = True
    ) -> Dict[str, List[Dict]]:
        """
        Get recommendations for a user based on their ratings.
        
        Args:
            user_id: User ID
            media_types: List of media types to search (None = all)
            top_k: Number of recommendations per media type
            exclude_rated: Whether to exclude items the user has already rated
            
        Returns:
            Dict mapping media types to lists of recommendations
        """
        # Compute user's taste profile
        profile = self.compute_user_taste_profile(user_id)
        if not profile:
            return {}
        
        # Get items user has already rated (to exclude)
        rated_item_ids = set()
        if exclude_rated:
            rated_item_ids = set(self.db.user.get_rated_item_ids(user_id))
        
        # Use 384D embedding for matching (more accurate)
        results = {}
        if media_types is None:
            media_types = ['movie', 'music', 'book']
        
        for media_type in media_types:
            # Search using 384D embeddings
            items = self.db.media.search_by_embedding(
                embedding=profile['embedding_384d'],
                media_type=media_type,
                limit=top_k * 3  # Get extra to filter out rated items
            )
            
            # Filter out rated items
            filtered = [item for item in items if item['id'] not in rated_item_ids]
            
            # Limit to top_k
            items = filtered[:top_k]
            
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
        
        # Validate vector lengths
        if len(user_taste_vector) != 8:
            raise ValueError(f"Taste vector must have exactly 8 dimensions, got {len(user_taste_vector)}")
        if len(item_taste_vector) != 8:
            raise ValueError(f"Item taste vector has invalid length: {len(item_taste_vector)}")
        
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

