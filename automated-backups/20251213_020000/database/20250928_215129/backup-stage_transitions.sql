-- Backup script for table: stage_transitions
\copy (SELECT * FROM stage_transitions) TO 'stage_transitions_backup.csv' WITH CSV HEADER;
