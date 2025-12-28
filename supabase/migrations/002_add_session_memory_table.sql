-- ============================================================
-- Add session_memory table for Phase 5 Memory System
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create session_memory table
CREATE TABLE IF NOT EXISTS session_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  -- Entities extracted from user answers
  mentioned_entities JSONB DEFAULT '{
    "audiences": [],
    "competitors": [],
    "features": [],
    "numbers": [],
    "locations": []
  }'::jsonb,

  -- Summaries of each field
  field_summaries JSONB DEFAULT '{}'::jsonb,

  -- Detected contradictions
  contradictions JSONB DEFAULT '[]'::jsonb,

  -- User communication preferences
  user_preferences JSONB DEFAULT '{}'::jsonb,

  -- Key metrics mentioned (revenue, users, timeline)
  key_metrics JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint on session_id
  CONSTRAINT unique_session_memory UNIQUE (session_id)
);

-- Add comments
COMMENT ON TABLE session_memory IS 'Stores extracted entities, contradictions, and summaries from conversation';
COMMENT ON COLUMN session_memory.mentioned_entities IS 'Audiences, competitors, features, numbers, locations extracted from answers';
COMMENT ON COLUMN session_memory.field_summaries IS 'Brief summary of each completed field';
COMMENT ON COLUMN session_memory.contradictions IS 'List of detected contradictions in user answers';
COMMENT ON COLUMN session_memory.user_preferences IS 'Communication style, detail level, question pace';
COMMENT ON COLUMN session_memory.key_metrics IS 'Revenue target, user target, timeline mentioned';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_memory_session_id
ON session_memory(session_id);

-- Enable RLS
ALTER TABLE session_memory ENABLE ROW LEVEL SECURITY;

-- Create permissive policy
DROP POLICY IF EXISTS "Allow all access to session_memory" ON session_memory;
CREATE POLICY "Allow all access to session_memory"
ON session_memory FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_session_memory_updated_at ON session_memory;
CREATE TRIGGER update_session_memory_updated_at
  BEFORE UPDATE ON session_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Verification
-- ============================================================
-- Run this to verify:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'session_memory'
ORDER BY ordinal_position;
