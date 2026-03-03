-- Add a persisted role_type field for roles (used by Roles filter + form)
ALTER TABLE public.roles
ADD COLUMN IF NOT EXISTS role_type TEXT;

CREATE INDEX IF NOT EXISTS idx_roles_role_type
ON public.roles(role_type);
