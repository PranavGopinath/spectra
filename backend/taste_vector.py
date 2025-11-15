"""Taste vector projection engine for Spectra."""

from sentence_transformers import SentenceTransformer
import numpy as np
import os
from typing import Union, List


class TasteVectorEngine:
    """Converts text/embeddings to 8D taste vectors."""
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', direction_vectors_path: str = None):
        print(f"Loading Sentence Transformer model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("✓ Model loaded")
        
        if direction_vectors_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            direction_vectors_path = os.path.join(current_dir, 'data', 'dimension_vectors.npy')
        
        print(f"Loading direction vectors from {direction_vectors_path}...")
        self.direction_vectors = np.load(direction_vectors_path)
        print(f"✓ Loaded {len(self.direction_vectors)} direction vectors")
        
        assert self.direction_vectors.shape == (8, 384), \
            f"Expected shape (8, 384), got {self.direction_vectors.shape}"
    
    def embed(self, text: Union[str, List[str]]) -> np.ndarray:
        """Convert text to 384D embedding."""
        return self.model.encode(text)
    
    def project(self, embedding: np.ndarray) -> np.ndarray:
        """Project 384D embedding onto 8 taste dimensions."""
        if embedding.ndim == 1:
            return self.direction_vectors @ embedding
        else:
            return embedding @ self.direction_vectors.T
    
    def text_to_taste_vector(self, text: Union[str, List[str]]) -> np.ndarray:
        """Convert text directly to 8D taste vector (embed + project)."""
        embedding = self.embed(text)
        return self.project(embedding)
    
    def batch_process(self, texts: List[str]) -> tuple[np.ndarray, np.ndarray]:
        """Process multiple texts efficiently, returns (embeddings_384d, taste_vectors_8d)."""
        embeddings = self.embed(texts)
        taste_vectors = self.project(embeddings)
        return embeddings, taste_vectors

