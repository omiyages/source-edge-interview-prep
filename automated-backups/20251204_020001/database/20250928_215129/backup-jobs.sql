-- Backup script for table: jobs
\copy (SELECT * FROM jobs) TO 'jobs_backup.csv' WITH CSV HEADER;
