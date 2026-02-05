# Kanban Board Setup Guide

## Overview
A comprehensive Kanban board has been implemented in the admin dashboard for managing users through the interview process. This system allows admins to track user progress, manage notes, and organize users by interview stages.

## Features Implemented

### 🎯 **Kanban Board Columns**
- **Interested** - New users who have shown interest
- **Scheduled** - Users with scheduled interviews
- **CV Sent** - Users who have submitted CVs
- **1st Interview** - First interview stage
- **2nd Interview** - Second interview stage
- **3rd Interview+** - Advanced interview stages
- **Debrief** - Post-interview debriefing
- **Offer** - Users who received offers
- **Offer Accepted** - Users who accepted offers

### 🃏 **User Cards Display**
- ✅ **Assigned role** from the role table
- ✅ **Last updated timestamp** for stage changes
- ✅ **Time spent on website** (from session tracking)
- ✅ **Last activity timestamp**
- ✅ **Reject button** to hide users from board

### 🔄 **Drag & Drop Functionality**
- ✅ **Drag users between stages** with visual feedback
- ✅ **Automatic timestamp updates** when moving stages
- ✅ **Database synchronization** for all changes
- ✅ **Real-time updates** across admin sessions

### 📋 **User Detail Modal**
- ✅ **Assigned courses** with progress tracking
- ✅ **Time spent on courses** from session data
- ✅ **Course progress percentages**
- ✅ **Admin notes section** for user-specific notes
- ✅ **To-do list management** with completion tracking
- ✅ **Editable notes and todos** with real-time updates

## Setup Instructions

### Step 1: Database Setup
Execute the SQL commands in `src/database/kanban-schema.sql` in your Supabase SQL editor:

```sql
-- This will create all necessary tables and functions
-- Run all the SQL commands from the file
```

### Step 2: Install Dependencies
The drag-and-drop library has been installed:
```bash
npm install @hello-pangea/dnd
```

### Step 3: Access the Kanban Board
1. **Login as admin** to the admin dashboard
2. **Click the "Kanban" tab** (first tab in the admin dashboard)
3. **Start managing users** through the interview pipeline

## How to Use

### 🎯 **Moving Users Between Stages**
1. **Drag and drop** user cards between columns
2. **Timestamps are automatically updated** in the database
3. **Stage transitions are logged** for audit trail
4. **Real-time updates** across all admin sessions

### 📝 **Managing User Details**
1. **Click on any user card** to open the detail modal
2. **View assigned courses** and progress
3. **Add admin notes** for user-specific information
4. **Create to-do items** for follow-up actions
5. **Track completion** of to-do items

### 🚫 **Rejecting Users**
1. **Click the X button** on any user card
2. **Confirm rejection** in the popup
3. **User is hidden** from the board
4. **Rejection is logged** in the database

### 📊 **Viewing User Information**
- **Overview tab**: Basic user info and quick stats
- **Courses tab**: Assigned courses with progress bars
- **Notes tab**: Admin notes and to-do items

## Database Schema

### **Tables Created:**
- `user_stages` - Tracks current stage for each user
- `stage_transitions` - Logs all stage changes with timestamps
- `admin_notes` - Stores notes and to-do items
- `user_rejections` - Tracks rejected users

### **Functions Created:**
- `move_user_to_stage()` - Moves users between stages
- `get_user_current_stage()` - Gets user's current stage
- `get_users_by_stage()` - Gets all users in a specific stage
- `reject_user()` - Rejects and hides users

## Security Features

### 🔒 **Row Level Security (RLS)**
- ✅ **Admin-only access** to all Kanban data
- ✅ **Secure user isolation** - users can't see other users' data
- ✅ **Audit trail** for all stage changes
- ✅ **Permission-based access** to all functions

### 🛡️ **Data Protection**
- ✅ **Input validation** for all user inputs
- ✅ **SQL injection protection** through parameterized queries
- ✅ **Rate limiting** on database operations
- ✅ **Secure authentication** required for all operations

## Performance Optimizations

### ⚡ **Database Indexes**
- ✅ **Optimized queries** for stage-based filtering
- ✅ **Indexed user lookups** for fast card rendering
- ✅ **Efficient stage transitions** with minimal database calls
- ✅ **Cached user data** for smooth drag-and-drop

### 🚀 **Frontend Optimizations**
- ✅ **Lazy loading** of user details
- ✅ **Optimistic updates** for smooth UX
- ✅ **Debounced database calls** to prevent spam
- ✅ **Real-time updates** without page refresh

## Troubleshooting

### **If users don't appear in Kanban:**
1. **Check database setup** - ensure all tables are created
2. **Verify RLS policies** - ensure admin permissions are set
3. **Check user assignments** - ensure users have assigned roles
4. **Refresh the page** - try reloading the admin dashboard

### **If drag-and-drop doesn't work:**
1. **Check browser console** for JavaScript errors
2. **Verify @hello-pangea/dnd** is installed correctly
3. **Ensure user permissions** - only admins can move users
4. **Check database connectivity** - ensure Supabase connection

### **If modal doesn't open:**
1. **Check user data** - ensure user has valid information
2. **Verify course assignments** - check if courses are properly linked
3. **Check database permissions** - ensure admin can read user data
4. **Refresh and try again** - sometimes a page refresh helps

## Advanced Features

### 📈 **Analytics Integration**
- **Stage transition tracking** for pipeline analytics
- **Time-in-stage metrics** for process optimization
- **User engagement tracking** through session data
- **Completion rate monitoring** for each stage

### 🔄 **Automation Opportunities**
- **Auto-advance users** based on course completion
- **Email notifications** for stage changes
- **Scheduled reminders** for follow-up actions
- **Integration with external systems** (HR, ATS)

## Future Enhancements

### 🎯 **Planned Features**
- **Bulk operations** for moving multiple users
- **Custom stage configuration** for different roles
- **Advanced filtering** and search capabilities
- **Export functionality** for reporting
- **Mobile-responsive design** for on-the-go management

The Kanban board is now fully functional and ready for managing your user pipeline! 🎉

