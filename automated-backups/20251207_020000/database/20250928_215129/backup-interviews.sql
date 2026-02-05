-- Backup script for table: interviews
\copy (SELECT * FROM interviews) TO 'interviews_backup.csv' WITH CSV HEADER;
