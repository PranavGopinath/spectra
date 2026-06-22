-- Migration: Create media_items table (initial schema)

CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    year INTEGER,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(384),
    taste_vector vector(8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(media_type);
CREATE INDEX IF NOT EXISTS idx_year ON media_items(year);
CREATE INDEX IF NOT EXISTS idx_metadata ON media_items USING gin (metadata);
