-- Update the full name for the admin user
UPDATE public.profiles 
SET full_name = 'Admin Nam', updated_at = now()
WHERE email = 'namtae.quicksit@gmail.com';