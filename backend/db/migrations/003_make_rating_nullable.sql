-- Migration: Make rating nullable to allow watchlist items without ratings
-- Created: 2024

-- Drop the NOT NULL constraint and CHECK constraint on rating
ALTER TABLE user_ratings 
DROP CONSTRAINT IF EXISTS user_ratings_rating_check;

ALTER TABLE user_ratings 
ALTER COLUMN rating DROP NOT NULL;

-- Re-add the CHECK constraint but allow NULL
ALTER TABLE user_ratings 
ADD CONSTRAINT user_ratings_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

