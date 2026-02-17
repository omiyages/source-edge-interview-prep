-- Add slug column for URL-friendly role detail pages (e.g. /role/senior-sre)
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
