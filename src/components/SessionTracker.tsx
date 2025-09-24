import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useAuth } from '@/hooks/useAuth';

/**
 * SessionTracker Component
 * 
 * This component automatically tracks user session time when they're logged in.
 * It runs in the background and updates the database with time spent on the website.
 * 
 * Features:
 * - Tracks time only when user is authenticated
 * - Pauses tracking when tab is not visible
 * - Updates database every minute
 * - Handles page unload gracefully
 */
export const SessionTracker = () => {
  const { user } = useAuth();
  
  // Only track sessions for authenticated users
  useSessionTracking();

  // This component doesn't render anything - it just runs the tracking logic
  return null;
};
