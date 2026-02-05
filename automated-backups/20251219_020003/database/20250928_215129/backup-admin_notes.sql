-- Backup script for table: admin_notes
\copy (SELECT * FROM admin_notes) TO 'admin_notes_backup.csv' WITH CSV HEADER;
