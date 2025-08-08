
-- Update the hiring stage name from "Scheduled a Call" to "Booked"
UPDATE hiring_stages 
SET name = 'Booked' 
WHERE name = 'Scheduled a Call';
