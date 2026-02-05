# Setup Information Fields for Kanban User Popup

## Problem
The Information section in the Kanban user popup is failing to save because the required database columns don't exist yet.

## Solution
You need to run a SQL script to add the new columns to the `profiles` table.

## Steps to Fix

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the SQL Editor

### 2. Run the SQL Script
Copy and paste this SQL code into the SQL Editor and run it:

```sql
-- Add information fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_job_title TEXT;
```

### 3. Verify the Columns Were Added
Run this query to confirm the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('linkedin_url', 'current_salary', 'expected_salary', 'notice_period', 'current_company', 'current_job_title')
ORDER BY column_name;
```

### 4. Test the Feature
After running the SQL script:
1. Go to the Kanban board
2. Click on any user to open their popup
3. Go to the Overview tab
4. Scroll down to the Information section
5. Click "Edit" and try to save some information

## Expected Result
The Information section should now work properly, allowing you to save and edit:
- LinkedIn URL
- Current Salary
- Expected Salary
- Notice Period
- Current Company
- Current Job Title

## Troubleshooting
If you still get errors:
1. Make sure you're running the SQL in the correct Supabase project
2. Check that the columns were actually added using the verification query
3. Try refreshing the page after running the SQL script
