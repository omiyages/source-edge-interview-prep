
-- Add is_active column to candidates table if it doesn't exist
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add order_index column to hiring_stages table to match interface
ALTER TABLE hiring_stages ADD COLUMN IF NOT EXISTS order_index integer;

-- Update existing hiring_stages to have order_index based on stage_order
UPDATE hiring_stages SET order_index = stage_order WHERE order_index IS NULL;

-- Make order_index not null
ALTER TABLE hiring_stages ALTER COLUMN order_index SET NOT NULL;
