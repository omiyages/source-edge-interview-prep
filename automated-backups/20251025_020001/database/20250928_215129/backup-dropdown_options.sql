-- Backup script for table: dropdown_options
\copy (SELECT * FROM dropdown_options) TO 'dropdown_options_backup.csv' WITH CSV HEADER;
