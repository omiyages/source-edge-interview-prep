-- Automated Database Backup Script
-- Run this script to backup your Supabase database

-- Export all tables
\copy (SELECT * FROM profiles) TO 'profiles_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_stages) TO 'user_stages_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM admin_notes) TO 'admin_notes_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_rejections) TO 'user_rejections_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM interviews) TO 'interviews_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM jobs) TO 'jobs_backup.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_jobs) TO 'user_jobs_backup.csv' WITH CSV HEADER;

-- Export functions
\copy (SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = 'public') TO 'functions_backup.csv' WITH CSV HEADER;

-- Export policies
\copy (SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies) TO 'policies_backup.csv' WITH CSV HEADER;
