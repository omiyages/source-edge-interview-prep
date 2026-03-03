-- Add Japanese proficiency level for roles.
ALTER TABLE public.roles
ADD COLUMN IF NOT EXISTS japanese_level TEXT NOT NULL DEFAULT 'None'
CHECK (japanese_level IN ('None', 'Conversational', 'Business', 'Native'));

CREATE INDEX IF NOT EXISTS idx_roles_japanese_level
ON public.roles(japanese_level);
