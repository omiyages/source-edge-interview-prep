-- Backup script for table: profiles
\copy (SELECT * FROM profiles) TO 'profiles_backup.csv' WITH CSV HEADER;
