
// ABOUTME: Hook for fetching Google Sheets sample data with rate limiting and deduplication
// ABOUTME: Prevents API quota exhaustion by limiting concurrent requests and caching results

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleSheetsSample = () => {
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Rate limiting and deduplication
  const lastRequestTime = useRef<number>(0);
  const currentRequest = useRef<Promise<void> | null>(null);
  const cache = useRef<Map<string, { data: string[][], timestamp: number }>>(new Map());
  
  const RATE_LIMIT_MS = 2000; // Minimum 2 seconds between requests
  const CACHE_DURATION_MS = 30000; // Cache for 30 seconds

  const fetchSampleData = async (sheetId: string, sheetName?: string, range?: string) => {
    if (!sheetId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Google Sheets ID',
        variant: 'destructive',
      });
      return;
    }

    // Create cache key
    const cacheKey = `${sheetId}-${sheetName || ''}-${range || 'A1:Z10'}`;
    
    // Check cache first
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      console.log('📋 Using cached sample data for:', cacheKey);
      setSampleData(cached.data);
      return;
    }

    // If already loading the same request, wait for it
    if (currentRequest.current) {
      console.log('⏳ Request already in progress, waiting...');
      await currentRequest.current;
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`🐌 Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    setIsLoading(true);
    
    const requestPromise = (async () => {
      try {
        lastRequestTime.current = Date.now();
        
        console.log('🔍 Fetching sample data from Google Sheets:', sheetId, sheetName, range);
        
        const { data, error } = await supabase.functions.invoke('google-sheets-sample', {
          body: {
            sheetId,
            sheetName,
            range: range || 'A1:Z10', // Get first 10 rows for preview
          },
        });

        if (error) {
          console.error('❌ Sample data error:', error);
          throw error;
        }

        if (data && data.values) {
          setSampleData(data.values);
          // Cache the result
          cache.current.set(cacheKey, {
            data: data.values,
            timestamp: Date.now()
          });
          console.log('✅ Sample data fetched and cached successfully');
        } else {
          setSampleData([]);
          toast({
            title: 'No Data',
            description: 'No data found in the specified range',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('❌ Error fetching sample data:', error);
        
        // Handle rate limit errors specifically
        if (error.message && error.message.includes('429')) {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'Too many requests to Google Sheets. Please wait a moment and try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: `Failed to fetch sample data: ${error.message}`,
            variant: 'destructive',
          });
        }
        setSampleData([]);
      } finally {
        setIsLoading(false);
        currentRequest.current = null;
      }
    })();

    currentRequest.current = requestPromise;
    await requestPromise;
  };

  return {
    sampleData,
    isLoading,
    fetchSampleData,
  };
};
