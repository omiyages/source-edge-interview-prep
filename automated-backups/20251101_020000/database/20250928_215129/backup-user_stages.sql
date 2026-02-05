-- Backup script for table: user_stages
\copy (SELECT * FROM user_stages) TO 'user_stages_backup.csv' WITH CSV HEADER;
