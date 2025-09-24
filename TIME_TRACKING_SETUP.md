# Time Tracking Implementation

## Problem Identified
The admin dashboard was showing 0 hours for all users because **no time tracking was implemented**. The `total_session_time_minutes` field existed in the database but was never being updated.

## Solution Implemented

### 1. Session Tracking Hook (`useSessionTracking.ts`)
- **Tracks user activity** when authenticated
- **Pauses tracking** when tab is not visible (visibilitychange event)
- **Updates database** every minute with accumulated time
- **Handles page unload** gracefully to save final session time

### 2. Database Functions (`session-tracking.sql`)
- **`update_user_session_time()`** - Updates user's total session time
- **`get_user_session_stats()`** - Gets detailed session statistics
- **`reset_user_session_time()`** - Admin function to reset user time
- **Session logging table** - Optional detailed tracking

### 3. Integration
- **SessionTracker component** - Automatically runs for all authenticated users
- **App.tsx integration** - Tracks time across all pages
- **SessionTimeDisplay component** - Debug component to verify tracking

## Setup Instructions

### Step 1: Run Database Setup
Execute the SQL commands in `src/database/session-tracking.sql` in your Supabase SQL editor:

```sql
-- This will create the necessary functions and tables
-- Run all the SQL commands from the file
```

### Step 2: Test the Implementation
1. **Add SessionTimeDisplay temporarily** to any page to see real-time tracking:
```tsx
import { SessionTimeDisplay } from '@/components/SessionTimeDisplay';

// Add this to any component to see session time
<SessionTimeDisplay />
```

2. **Check the admin dashboard** - Users should now show actual time spent
3. **Test tab switching** - Time should pause when tab is not visible
4. **Test page refresh** - Session should continue tracking

### Step 3: Remove Debug Component
Once verified, remove the `SessionTimeDisplay` component from your pages.

## How It Works

1. **User logs in** → Session tracking starts automatically
2. **User browses website** → Time accumulates every minute
3. **User switches tabs** → Time tracking pauses
4. **User returns to tab** → Time tracking resumes
5. **User logs out/leaves** → Final time is saved to database

## Features

- ✅ **Automatic tracking** - No user interaction required
- ✅ **Tab visibility aware** - Pauses when tab is hidden
- ✅ **Database updates** - Saves time every minute
- ✅ **Graceful handling** - Saves time on page unload
- ✅ **Admin dashboard** - Shows real time spent
- ✅ **Session logging** - Optional detailed analytics

## Database Schema

The implementation uses these database fields:
- `profiles.total_session_time_minutes` - Total time in minutes
- `profiles.last_activity_at` - Last activity timestamp
- `user_session_logs` - Optional detailed session logs

## Troubleshooting

### If time tracking isn't working:
1. **Check browser console** for any errors
2. **Verify database functions** are created in Supabase
3. **Check user authentication** - tracking only works for logged-in users
4. **Test with SessionTimeDisplay** component to see real-time updates

### If admin dashboard still shows 0:
1. **Wait a few minutes** - Updates happen every minute
2. **Check database directly** - Query `profiles` table for `total_session_time_minutes`
3. **Verify RLS policies** - Make sure functions have proper permissions

## Performance Notes

- **Minimal impact** - Only updates every minute
- **Efficient queries** - Uses database functions for updates
- **Background processing** - Doesn't block UI
- **Memory efficient** - Cleans up intervals on unmount

## Security

- **User isolation** - Users can only update their own time
- **Admin functions** - Only admins can reset user time
- **RLS policies** - Proper row-level security implemented
- **Input validation** - All inputs are validated and sanitized
