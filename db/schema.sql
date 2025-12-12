CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE media_items(

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

CREATE INDEX idx_media_type ON media_items(media_type);
CREATE INDEX idx_year ON media_items(year);

CREATE INDEX idx_taste_vector ON media_items
    USING ivfflat (taste_vector vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_embedding ON media_items
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_metadata ON media_items USING gin (metadata);