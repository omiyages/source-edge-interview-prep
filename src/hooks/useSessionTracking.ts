import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  totalTime: number;
}

export const useSessionTracking = () => {
  const { user } = useAuth();
  const sessionRef = useRef<SessionData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Update session time in database
  const updateSessionTime = useCallback(async (additionalMinutes: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc('update_user_session_time', {
        user_id: user.id,
        additional_minutes: additionalMinutes
      });

      // error handled silently
    } catch (error) {
      // Silently handle
    }
  }, [user?.id]);

  // Start tracking session
  const startSession = useCallback(() => {
    if (!user?.id || sessionRef.current) return;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    sessionRef.current = {
      sessionId,
      startTime: now,
      lastActivity: now,
      totalTime: 0
    };

    // Update every minute
    intervalRef.current = setInterval(() => {
      if (sessionRef.current && isActiveRef.current) {
        const now = Date.now();
        const timeDiff = now - sessionRef.current.lastActivity;
        const minutes = Math.floor(timeDiff / (1000 * 60));
        
        if (minutes > 0) {
          sessionRef.current.totalTime += minutes;
          sessionRef.current.lastActivity = now;
          updateSessionTime(minutes);
        }
      }
    }, 60000); // Check every minute

  }, [user?.id, updateSessionTime]);

  // Stop tracking session
  const stopSession = useCallback(() => {
    if (sessionRef.current && isActiveRef.current) {
      const now = Date.now();
      const timeDiff = now - sessionRef.current.lastActivity;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      if (minutes > 0) {
        updateSessionTime(minutes);
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    sessionRef.current = null;
  }, [updateSessionTime]);

  // Handle visibility change (tab focus/blur)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isActiveRef.current = false;
      if (sessionRef.current) {
        const now = Date.now();
        const timeDiff = now - sessionRef.current.lastActivity;
        const minutes = Math.floor(timeDiff / (1000 * 60));
        
        if (minutes > 0) {
          sessionRef.current.totalTime += minutes;
          sessionRef.current.lastActivity = now;
          updateSessionTime(minutes);
        }
      }
    } else {
      isActiveRef.current = true;
      if (sessionRef.current) {
        sessionRef.current.lastActivity = Date.now();
      }
    }
  }, [updateSessionTime]);

  // Handle page unload
  const handleBeforeUnload = useCallback(() => {
    if (sessionRef.current && isActiveRef.current) {
      const now = Date.now();
      const timeDiff = now - sessionRef.current.lastActivity;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      if (minutes > 0) {
        updateSessionTime(minutes);
      }
    }
  }, [updateSessionTime]);

  // Initialize session tracking
  useEffect(() => {
    if (!user?.id) return;

    startSession();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      stopSession();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id, startSession, stopSession, handleVisibilityChange, handleBeforeUnload]);

  return {
    sessionId: sessionRef.current?.sessionId,
    totalTime: sessionRef.current?.totalTime || 0,
    isActive: isActiveRef.current
  };
};

