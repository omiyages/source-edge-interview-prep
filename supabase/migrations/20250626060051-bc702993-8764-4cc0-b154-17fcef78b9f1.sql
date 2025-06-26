
-- Update the user namtae.quicksit@gmail.com to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'namtae.quicksit@gmail.com';

-- If the profile doesn't exist yet, let's create it as admin
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'namtae.quicksit@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'namtae.quicksit@gmail.com'
);
