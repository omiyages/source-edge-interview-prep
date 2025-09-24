import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useAuth } from '@/hooks/useAuth';
import { Clock } from 'lucide-react';

/**
 * SessionTimeDisplay Component
 * 
 * Shows the current session time for debugging/testing purposes.
 * This component can be temporarily added to any page to verify
 * that time tracking is working correctly.
 */
export const SessionTimeDisplay = () => {
  const { user } = useAuth();
  const { sessionId, totalTime, isActive } = useSessionTracking();

  if (!user) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-primary" />
        <div>
          <div className="font-medium">Session Time</div>
          <div className="text-muted-foreground">
            {Math.floor(totalTime / 60)}h {totalTime % 60}m
          </div>
          <div className="text-xs text-muted-foreground">
            Status: {isActive ? 'Active' : 'Paused'}
          </div>
          {sessionId && (
            <div className="text-xs text-muted-foreground">
              ID: {sessionId.slice(-8)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
