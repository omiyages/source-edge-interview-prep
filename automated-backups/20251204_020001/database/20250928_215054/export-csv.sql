-- CSV Export Script for Database Backup
-- Run this script to export all tables as CSV files

\copy (SELECT * FROM profiles) TO 'profiles.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_stages) TO 'user_stages.csv' WITH CSV HEADER;
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions.csv' WITH CSV HEADER;
\copy (SELECT * FROM admin_notes) TO 'admin_notes.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_rejections) TO 'user_rejections.csv' WITH CSV HEADER;
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options.csv' WITH CSV HEADER;
\copy (SELECT * FROM interviews) TO 'interviews.csv' WITH CSV HEADER;
\copy (SELECT * FROM jobs) TO 'jobs.csv' WITH CSV HEADER;
\copy (SELECT * FROM user_jobs) TO 'user_jobs.csv' WITH CSV HEADER;
