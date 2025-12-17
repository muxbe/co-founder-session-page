-- Idea Passport Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,  -- Optional: can link to auth.users later
    idea_title TEXT,
    idea_description TEXT,
    user_experience JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'intro' CHECK (status IN ('intro', 'collecting-experience', 'in-progress', 'completed')),
    current_field_index INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- FIELDS TABLE
-- ============================================
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📝',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'complete')),
    questions JSONB DEFAULT '[]'::jsonb,
    answers JSONB DEFAULT '[]'::jsonb,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    question_count INTEGER DEFAULT 3,
    depth_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bot', 'user', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SESSION MEMORY TABLE
-- ============================================
CREATE TABLE session_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    mentioned_entities JSONB DEFAULT '{
        "audiences": [],
        "competitors": [],
        "features": [],
        "numbers": [],
        "locations": []
    }'::jsonb,
    field_summaries JSONB DEFAULT '{}'::jsonb,
    contradictions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_fields_session ON fields(session_id);
CREATE INDEX idx_fields_order ON fields(session_id, order_index);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(session_id, created_at);
CREATE INDEX idx_memory_session ON session_memory(session_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fields_updated_at
    BEFORE UPDATE ON fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memory_updated_at
    BEFORE UPDATE ON session_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (Optional - Enable Later)
-- ============================================
-- For now, allow all operations (no auth required)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_memory ENABLE ROW LEVEL SECURITY;

-- Public access policies (for development)
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on fields" ON fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on session_memory" ON session_memory FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE sessions IS 'Stores user idea passport sessions';
COMMENT ON TABLE fields IS 'Stores individual fields for each session (problem, solution, etc.)';
COMMENT ON TABLE messages IS 'Stores chat messages for each session';
COMMENT ON TABLE session_memory IS 'Stores AI memory/context for each session';

COMMENT ON COLUMN sessions.user_experience IS 'JSON: {role, business_experience, startup_knowledge, idea_stage}';
COMMENT ON COLUMN fields.questions IS 'Array of questions asked for this field';
COMMENT ON COLUMN fields.answers IS 'Array of user answers for this field';
COMMENT ON COLUMN messages.metadata IS 'JSON: {is_suggestion, references_field, is_example}';
