
// ABOUTME: Secure data access hook that enforces data protection policies
// ABOUTME: Provides secure access to user data with proper role-based permissions

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSecureCandidates = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['secure-candidates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      let query;
      
      // Build query based on user role
      if (profile?.role === 'admin') {
        query = supabase.from('candidates').select('*');
      } else {
        // Non-admin users get limited fields and only their own data
        const safeFields = ['id', 'full_name', 'current_company', 'years_of_experience', 'skillsets', 'is_active', 'created_at', 'updated_at'];
        query = supabase
          .from('candidates')
          .select(safeFields.join(', '))
          .eq('user_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
};

export const useSecureProfiles = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['secure-profiles', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      let query;

      // Build query based on user role
      if (profile?.role === 'admin') {
        query = supabase.from('profiles').select('*');
      } else {
        // Non-admin users can only see their own profile with safe fields
        const safeFields = ['id', 'full_name', 'role', 'current_company', 'years_of_experience', 'skillsets', 'is_active', 'created_at', 'updated_at'];
        query = supabase
          .from('profiles')
          .select(safeFields.join(', '))
          .eq('id', user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
};
