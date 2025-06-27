
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

export const fetchResources = async (limit: number = 10): Promise<Resource[]> => {
  try {
    console.log('📥 Fetching resources...');
    
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching resources:', error);
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }
    
    console.log('✅ Resources fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Service error fetching resources:', error);
    throw error;
  }
};
