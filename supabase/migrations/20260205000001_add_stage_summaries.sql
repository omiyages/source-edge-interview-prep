-- Create table to store AI-generated stage summaries
CREATE TABLE IF NOT EXISTS stage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES course_stages(id) ON DELETE CASCADE,
  tldr_points JSONB DEFAULT '[]'::jsonb,
  testing_focus_quote TEXT,
  testing_focus_points JSONB DEFAULT '[]'::jsonb,
  common_pitfalls JSONB DEFAULT '[]'::jsonb,
  content_hash TEXT, -- Hash of stage content to detect changes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stage_id)
);

-- Add index for fast lookups by stage_id
CREATE INDEX IF NOT EXISTS idx_stage_summaries_stage_id ON stage_summaries(stage_id);

-- Enable RLS
ALTER TABLE stage_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read summaries
CREATE POLICY "Anyone can read stage summaries"
  ON stage_summaries FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage stage summaries"
  ON stage_summaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stage_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_stage_summary_timestamp ON stage_summaries;
CREATE TRIGGER update_stage_summary_timestamp
  BEFORE UPDATE ON stage_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_summary_timestamp();
