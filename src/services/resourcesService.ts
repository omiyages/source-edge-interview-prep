
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

export const fetchResources = async (limit: number = 10, page?: number): Promise<Resource[]> => {
  try {
    let query = supabase
      .from('resources')
      .select('id, title, description, url, category, created_at')
      .order('created_at', { ascending: false });

    if (page !== undefined) {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Service error fetching resources:', error);
    throw error;
  }
};
