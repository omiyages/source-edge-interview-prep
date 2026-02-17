-- Add AI summary column to roles table.
-- Generated once via OpenAI when a role is created/updated.
-- content_hash tracks whether the role content has changed, to avoid
-- regenerating the summary when the role hasn't actually been edited.
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS content_hash TEXT;
