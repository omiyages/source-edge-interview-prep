
-- Remove Google Sheets integration table and related components
DROP TABLE IF EXISTS google_sheets_integrations;

-- Remove any related functions (if they exist)
DROP FUNCTION IF EXISTS handle_google_sheets_integration();

-- Remove any related triggers (if they exist)
DROP TRIGGER IF EXISTS update_google_sheets_integrations_updated_at ON google_sheets_integrations;
