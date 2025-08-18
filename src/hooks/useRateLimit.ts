
// ABOUTME: Client-side rate limiting hook with server-side validation
// ABOUTME: Provides user feedback and prevents excessive API calls

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  operation: string;
  maxAttempts?: number;
  windowMinutes?: number;
}

export const useRateLimit = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const { toast } = useToast();

  const checkRateLimit = useCallback(async ({ 
    operation, 
    maxAttempts = 5, 
    windowMinutes = 15 
  }: RateLimitConfig): Promise<boolean> => {
    try {
      // Check if we're still in a local block period
      if (blockUntil && new Date() < blockUntil) {
        const remainingTime = Math.ceil((blockUntil.getTime() - Date.now()) / 1000 / 60);
        toast({
          title: "Rate Limited",
          description: `Please wait ${remainingTime} minutes before trying again.`,
          variant: "destructive",
        });
        return false;
      }

      // Check with server
      const { data: canProceed, error } = await supabase
        .rpc('check_rate_limit', {
          operation_name: operation,
          max_attempts: maxAttempts,
          window_minutes: windowMinutes
        });

      if (error) {
        console.error('Rate limit check failed:', error);
        return false;
      }

      if (!canProceed) {
        setIsBlocked(true);
        const newBlockUntil = new Date(Date.now() + windowMinutes * 60 * 1000);
        setBlockUntil(newBlockUntil);
        
        toast({
          title: "Rate Limited",
          description: `Too many attempts. Please wait ${windowMinutes} minutes before trying again.`,
          variant: "destructive",
        });
        return false;
      }

      // Reset local state if we can proceed
      setIsBlocked(false);
      setBlockUntil(null);
      return true;

    } catch (error) {
      console.error('Rate limit check error:', error);
      return false;
    }
  }, [blockUntil, toast]);

  return {
    checkRateLimit,
    isBlocked,
    blockUntil
  };
};
