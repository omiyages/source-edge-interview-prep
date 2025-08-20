
// ABOUTME: Secure data access hook that enforces data protection policies
// ABOUTME: Prevents EXPOSED_SENSITIVE_DATA vulnerabilities in queries

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { maskSensitiveData, filterSensitiveFields, checkDataAccessPermission } from '@/utils/sensitiveDataProtection';

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

      let query = supabase.from('candidates').select('*');

      // Filter sensitive fields for non-admin users
      if (profile?.role !== 'admin') {
        const safeFields = ['id', 'full_name', 'current_company', 'years_of_experience', 'skillsets', 'is_active', 'created_at', 'updated_at'];
        query = supabase.from('candidates').select(safeFields.join(', '));
      }

      // Apply user-specific filtering
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
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

      let query = supabase.from('profiles').select('*');

      // Non-admin users can only see their own profile
      if (profile?.role !== 'admin') {
        const safeFields = ['id', 'full_name', 'role', 'current_company', 'years_of_experience', 'skillsets', 'is_active', 'created_at', 'updated_at'];
        query = supabase.from('profiles').select(safeFields.join(', ')).eq('id', user.id);
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
      let query = supabase
        .from('google_sheets_integrations')
        .select(safeFields.join(', '))
        .eq('user_id', user.id);

      const { data, error } = await query;
      
      if (error) throw error;

      return maskSensitiveData(data || [], 'google_sheets_integrations', profile?.role);
    },
    enabled: !!user,
  });
};
