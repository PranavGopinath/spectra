-- Migration: Add half-star ratings support
-- Changes rating from INTEGER to DECIMAL(2,1) to allow 0.5 increments (1.0, 1.5, 2.0, ..., 5.0)

-- Drop the existing CHECK constraint if it exists (from migration 003)
ALTER TABLE user_ratings 
DROP CONSTRAINT IF EXISTS user_ratings_rating_check;

-- Change column type from INTEGER to DECIMAL(2,1)
-- This allows values like 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
ALTER TABLE user_ratings 
ALTER COLUMN rating TYPE DECIMAL(2,1) USING rating::DECIMAL(2,1);

-- Re-add the CHECK constraint allowing NULL and values from 0.5 to 5.0
-- The constraint ensures rating is NULL or between 0.5 and 5.0
-- Note: We allow any decimal in range; application logic enforces 0.5 increments
ALTER TABLE user_ratings 
ADD CONSTRAINT user_ratings_rating_check CHECK (
    rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)
);
