import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clerkSupabaseClient } from '@/lib/clerk';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

async function fetchOptions(fieldName: string): Promise<string[]> {
  const { data, error } = await clerkSupabaseClient
    .from('dropdown_options')
    .select('value')
    .eq('field_name', fieldName)
    .order('value');

  if (error) throw error;
  return data?.map((item) => item.value) || [];
}

export const useDropdownOptions = (fieldName: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['dropdown-options', fieldName],
    queryFn: () => fetchOptions(fieldName),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const addOption = useCallback(
    async (value: string): Promise<boolean> => {
      const trimmed = value.trim();
      if (!trimmed) return false;

      try {
        const { error } = await clerkSupabaseClient
          .from('dropdown_options')
          .insert({ field_name: fieldName, value: trimmed });

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['dropdown-options', fieldName] });
        toast({ title: 'Option Added', description: `"${trimmed}" has been added.` });
        return true;
      } catch {
        toast({ title: 'Error', description: 'Failed to add option.', variant: 'destructive' });
        return false;
      }
    },
    [fieldName, queryClient, toast]
  );

  return { options, isLoading, addOption };
};
