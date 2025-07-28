
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleSheetsSample = () => {
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSampleData = async (sheetId: string, sheetName?: string, range?: string) => {
    if (!sheetId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Google Sheets ID',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sample', {
        body: {
          sheetId,
          sheetName,
          range: range || 'A1:Z10', // Get first 10 rows for preview
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.values) {
        setSampleData(data.values);
      } else {
        setSampleData([]);
        toast({
          title: 'No Data',
          description: 'No data found in the specified range',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching sample data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch sample data: ${error.message}`,
        variant: 'destructive',
      });
      setSampleData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sampleData,
    isLoading,
    fetchSampleData,
  };
};
