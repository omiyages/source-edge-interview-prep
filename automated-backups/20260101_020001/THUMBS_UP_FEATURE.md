# Thumbs Up Feature Documentation

## Overview
The thumbs up feature allows users to like/favorite interview questions they find helpful. This helps surface the most valuable questions based on community feedback.

## Features
- ✅ Users can thumbs up questions they like
- ✅ Users can remove their thumbs up
- ✅ Thumbs up count is displayed on each question card
- ✅ Visual indicator shows if the current user has thumbs up the question
- ✅ Thumbs up button is available both on question cards and in the detailed view dialog
- ✅ Only authenticated users can thumbs up questions

## Database Schema

### Table: `question_thumbs_up`
```sql
- id: UUID (Primary Key)
- question_id: UUID (Foreign Key to interview_questions)
- user_id: UUID (Foreign Key to auth.users)
- created_at: TIMESTAMP
- UNIQUE constraint on (question_id, user_id) - prevents duplicate thumbs up
```

### Indexes
- Index on `question_id` for fast lookups
- Index on `user_id` for user-specific queries
- Index on `created_at` for sorting

### Row Level Security (RLS)
- **SELECT**: Anyone can view thumbs up counts
- **INSERT**: Only authenticated users can add thumbs up
- **DELETE**: Users can only remove their own thumbs up

## Implementation Details

### Database Migration
File: `supabase/migrations/20250115000001_add_thumbs_up.sql`

This migration:
1. Creates the `question_thumbs_up` table
2. Sets up indexes for performance
3. Configures RLS policies
4. Creates helper functions for counting and checking thumbs up

### React Hook
File: `src/hooks/useThumbsUp.ts`

Provides two hooks:
- `useQuestionThumbsUp(questionId)` - For a single question
- `useQuestionsThumbsUp(questionIds)` - For multiple questions (batch)

**Usage Example:**
```typescript
const { count, hasThumbsUp, toggleThumbsUp, isToggling } = useQuestionThumbsUp(questionId);

// In component:
<Button onClick={toggleThumbsUp} disabled={isToggling || !user}>
  <ThumbsUp className={hasThumbsUp ? "fill-current" : ""} />
  <span>{count}</span>
</Button>
```

### UI Component Updates
File: `src/components/QuestionCard.tsx`

The QuestionCard component now includes:
- Thumbs up button with count display
- Visual feedback (filled icon when user has thumbs up)
- Thumbs up button in the detailed view dialog
- Disabled state for non-authenticated users

## User Experience

### For Authenticated Users
1. See thumbs up count on each question card
2. Click thumbs up button to add/remove thumbs up
3. Visual feedback shows their thumbs up status
4. Toast notification confirms action

### For Non-Authenticated Users
1. Can see thumbs up counts
2. Thumbs up button is disabled
3. Tooltip indicates login is required

## Performance Considerations

- Thumbs up data is cached for 30 seconds (staleTime)
- Queries are optimized with indexes
- Batch queries available for multiple questions
- React Query handles caching and invalidation

## Security

- RLS policies ensure users can only manage their own thumbs up
- Authentication required for adding thumbs up
- Unique constraint prevents duplicate thumbs up
- Cascade delete removes thumbs up when question is deleted

## Future Enhancements

Potential improvements:
- Sort questions by thumbs up count
- Filter questions by minimum thumbs up count
- Show thumbs up history
- Analytics dashboard for most liked questions
- Export thumbs up data

## Testing

To test the feature:
1. Run the migration: Apply `20250115000001_add_thumbs_up.sql`
2. Login as a user
3. Navigate to questions page
4. Click thumbs up button on a question
5. Verify count increases and button shows filled state
6. Click again to remove thumbs up
7. Verify count decreases

## Migration Instructions

1. Apply the migration to your Supabase database:
   ```bash
   # If using Supabase CLI
   supabase migration up
   
   # Or apply manually via Supabase dashboard SQL editor
   ```

2. The feature will be available immediately after migration

## Troubleshooting

### Thumbs up not working
- Check if user is authenticated
- Verify RLS policies are enabled
- Check browser console for errors
- Verify migration was applied successfully

### Count not updating
- Check React Query cache invalidation
- Verify query keys are correct
- Check network tab for API errors

### Permission errors
- Verify RLS policies are correctly configured
- Check user authentication status
- Verify user_id matches auth.uid()



