-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vector vector(384),
  text text NOT NULL,
  "userId" text NOT NULL,
  created_at timestamp NOT NULL DEFAULT NOW(),
  metadata jsonb
);

-- Create the search function
CREATE OR REPLACE FUNCTION search_conversations(query_vector vector(384), max_results int)
RETURNS TABLE (
  id uuid,
  vector vector(384),
  text text,
  "userId" text,
  created_at timestamp,
  metadata jsonb,
  score float
) AS $$
  SELECT id, vector, text, "userId", created_at, metadata,
         vector <-> query_vector AS score
  FROM conversations
  ORDER BY score
  LIMIT max_results;
$$ LANGUAGE SQL; 