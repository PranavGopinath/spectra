from sentence_transformers import SentenceTransformer

import numpy as np

from taste_dimensions import TASTE_DIMENSIONS

def main():
    model = SentenceTransformer('all-MiniLM-L6-v2')
    dir_vectors = np.zeros((8, 384))

    for i, dimension in enumerate(TASTE_DIMENSIONS):
        pos_prompt = dimension['positive_prompt']
        neg_prompt = dimension['negative_prompt']

        positive_embedding = model.encode(pos_prompt)
        negative_embedding = model.encode(neg_prompt)

        direction  = positive_embedding - negative_embedding

        magnitude = np.sqrt(np.sum(direction ** 2))
        normalized = direction / magnitude

        dir_vectors[i] = normalized

        print(f"direction for {dimension['name']}")
    
    np.save('data/dimension_vectors.npy', dir_vectors)

    print("saved to file")

# At the end of your script, add verification:
def verify_vectors():
    vectors = np.load('data/dimension_vectors.npy')
    
    print(f"Shape: {vectors.shape}")  # Should be (8, 384)
    print(f"Number of dimensions: {len(vectors)}")  # Should be 8
    
    # Check that all vectors are normalized (magnitude ≈ 1)
    for i, vec in enumerate(vectors):
        magnitude = np.linalg.norm(vec)
        print(f"Dimension {i} magnitude: {magnitude:.6f}")  # Should be ~1.0
    
    # Check that vectors are different from each other
    print("\nFirst vector first 10 values:", vectors[0][:10])
    print("Second vector first 10 values:", vectors[1][:10])

main()
verify_vectors()