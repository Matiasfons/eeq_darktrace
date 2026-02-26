-- ============================================
-- Darktrace Antigena Actions - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS antigena_actions (
  codeid    BIGINT PRIMARY KEY,
  did       BIGINT,
  ip        TEXT,
  ips       TEXT[],
  action    TEXT,
  manual    BOOLEAN DEFAULT false,
  triggerer JSONB,
  label     TEXT,
  detail    TEXT,
  score     NUMERIC,
  pbid      BIGINT,
  model     TEXT,
  modeluuid TEXT,
  start     BIGINT,
  expires   BIGINT,
  blocked   BOOLEAN DEFAULT false,
  active    BOOLEAN DEFAULT false,
  cleared   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE antigena_actions ENABLE ROW LEVEL SECURITY;

-- 3. Policies: allow public read, insert, update (using anon key)
CREATE POLICY "Allow public read"
  ON antigena_actions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert"
  ON antigena_actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON antigena_actions FOR UPDATE
  USING (true);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_antigena_ip     ON antigena_actions (ip);
CREATE INDEX IF NOT EXISTS idx_antigena_active ON antigena_actions (active);
CREATE INDEX IF NOT EXISTS idx_antigena_start  ON antigena_actions (start DESC);
CREATE INDEX IF NOT EXISTS idx_antigena_action ON antigena_actions (action);

-- 5. Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON antigena_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
