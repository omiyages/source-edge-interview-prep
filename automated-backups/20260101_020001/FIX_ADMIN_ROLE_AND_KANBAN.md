# Fix Admin Role Change and Per-Admin Kanban Boards

## Problem Summary

Two issues were identified:
1. **Admin role change failing** with error: `function public.log_security_event(unknown, uuid, text, unknown, unknown, boolean, unknown, json) does not exist`
2. **Shared kanban board** - all admins see the same board instead of having individual boards

## Solution

A new migration file has been created: `supabase/migrations/20250129_fix_log_security_event_and_kanban.sql`

This migration:
1. Creates/recreates the `log_security_event` function that was missing
2. Adds per-admin kanban board support by adding an `admin_id` column to `user_stages`
3. Updates kanban functions to support per-admin views

## How to Apply the Fix

### Step 1: Apply the Migration

Run the SQL file in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250129_fix_log_security_event_and_kanban.sql`
4. Paste and execute the SQL

Alternatively, if you're using the Supabase CLI:

```bash
supabase db push
```

### Step 2: Verify the Fix

#### Test Admin Role Change

1. Log in as an admin user
2. Go to the Admin Dashboard
3. Navigate to the Users List tab
4. Try to change a user's role to "Admin"
5. The change should now work without errors

#### Test Per-Admin Kanban Boards

1. Log in as Admin A
2. Go to the Kanban Board tab
3. Move a user to a different stage
4. Log in as Admin B
5. Go to the Kanban Board tab
6. You should see your own independent board (different from Admin A's board)

## How Per-Admin Kanban Boards Work

### Key Changes

1. **`admin_id` column** added to `user_stages` table
   - If `NULL`: The user entry is visible to all admins (shared view)
   - If set to an admin's ID: Only that admin sees this user in their board

2. **Updated functions**:
   - `get_users_by_stage(p_admin_id)`: Returns users for the specified admin
   - `move_user_to_stage(p_user_id, p_new_stage, p_admin_id)`: Moves user in the specified admin's board

3. **Default behavior**: When an admin moves a user, they're added to that admin's board (by default)

### Usage Scenarios

#### Scenario 1: Independent Boards (Default)
- Each admin has their own kanban board
- Admin A moving a user doesn't affect Admin B's view
- Each admin manages their own pipeline

#### Scenario 2: Shared Board
- To make a user visible to all admins, set `admin_id` to NULL
- Use this for shared leads or important candidates

## Database Schema Changes

### New Column in `user_stages`
```sql
admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE
```

This column:
- References the admin user who owns this kanban entry
- Can be NULL for entries visible to all admins
- Creates an index for fast lookups

## Rollback (if needed)

If you need to revert to the shared board approach:

```sql
-- Set all admin_id to NULL to make all entries shared
UPDATE user_stages SET admin_id = NULL;

-- Remove the column (optional)
ALTER TABLE user_stages DROP COLUMN IF EXISTS admin_id;
```

## Troubleshooting

### Issue: Migration fails with "relation already exists"
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen
- If it does, the tables already exist and you just need the function updates

### Issue: Admins still see shared board
- Check if the frontend is passing the admin_id parameter
- Verify the migration ran successfully
- Check browser console for errors

### Issue: Can't change roles still
- Ensure the `log_security_event` function was created
- Check the Supabase logs for any errors
- Verify your admin permissions

## Testing Checklist

- [ ] Migration ran without errors
- [ ] Can change user roles without errors
- [ ] Each admin sees their own independent kanban board
- [ ] Moving users on one admin's board doesn't affect others
- [ ] Security event logging works (check Supabase logs)

## Additional Notes

- The migration is idempotent (safe to run multiple times)
- Existing data is preserved
- The function includes error handling to not fail operations if logging fails
- All security policies remain intact

