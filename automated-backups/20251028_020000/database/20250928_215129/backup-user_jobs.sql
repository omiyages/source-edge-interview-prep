-- Backup script for table: user_jobs
\copy (SELECT * FROM user_jobs) TO 'user_jobs_backup.csv' WITH CSV HEADER;
