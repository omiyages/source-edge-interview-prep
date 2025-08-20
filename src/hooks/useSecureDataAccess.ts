

// ABOUTME: Secure data access hook that enforces data protection policies
// ABOUTME: Prevents EXPOSED_SENSITIVE_DATA vulnerabilities in queries

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { maskSensitiveData, checkDataAccessPermission } from '@/utils/sensitiveDataProtection';

export const useSecureCandidates = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['secure-candidates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Check if user has permission to view candidates
      if (!checkDataAccessPermission('candidates', 'SELECT', profile?.role, user.id)) {
        throw new Error('Insufficient permissions');
      }

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

      // Mask any remaining sensitive data
      return maskSensitiveData(data || [], 'candidates', profile?.role);
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

      return maskSensitiveData(data || [], 'profiles', profile?.role);
    },
    enabled: !!user,
  });
};

export const useSecureGoogleSheetsIntegrations = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['secure-google-sheets', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Only users can access their own integrations
      const safeFields = ['id', 'sheet_id', 'sheet_name', 'is_active', 'last_sync_at', 'created_at', 'updated_at'];
      
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .select(safeFields.join(', '))
        .eq('user_id', user.id);
      
      if (error) throw error;

      return maskSensitiveData(data || [], 'google_sheets_integrations', profile?.role);
    },
    enabled: !!user,
  });
};

