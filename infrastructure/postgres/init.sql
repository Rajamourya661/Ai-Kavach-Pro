-- KAVACH AI Pro - Database Initialization
-- PostgreSQL setup script

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create indexes for full-text search (if needed later)
-- CREATE INDEX IF NOT EXISTS idx_detections_explanation_trgm ON detections USING gin (explanation gin_trgm_ops);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE kavach TO postgres;
