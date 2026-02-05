-- Backup script for table: user_rejections
\copy (SELECT * FROM user_rejections) TO 'user_rejections_backup.csv' WITH CSV HEADER;
