
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHiringStages = () => {
  return useQuery({
    queryKey: ['hiring-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiring_stages')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCandidatesWithPipeline = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: ['candidates-pipeline', includeInactive],
    queryFn: async () => {
      console.log('Fetching candidates with pipeline data...');
      
      let query = supabase
        .from('candidate_pipeline')
        .select(`
          id,
          candidate_id,
          stage_id,
          notes,
          created_at,
          updated_at,
          candidates (
            id,
            full_name,
            email,
            phone_number,
            linkedin_profile,
            current_company,
            years_of_experience,
            salary,
            skillsets,
            past_companies,
            general_notes,
            is_active
          ),
          hiring_stages (
            id,
            name,
            color
          )
        `);
      
      if (!includeInactive) {
        query = query.eq('candidates.is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching candidates:', error);
        throw error;
      }

      console.log('Raw pipeline data:', data);
      
      if (!data) return [];

      // Transform the data and check if candidates are also users
      const candidatesWithUserStatus = await Promise.all(
        data.map(async (item) => {
          const candidate = item.candidates;
          let isUser = false;
          
          // Check if candidate has an email and exists as a user
          if (candidate?.email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', candidate.email)
              .maybeSingle();
            
            isUser = !!profile;
          }

          return {
            id: candidate?.id,
            pipeline_id: item.id,
            stage_id: item.stage_id,
            full_name: candidate?.full_name,
            email: candidate?.email,
            phone_number: candidate?.phone_number,
            linkedin_profile: candidate?.linkedin_profile,
            current_company: candidate?.current_company,
            years_of_experience: candidate?.years_of_experience,
            salary: candidate?.salary,
            skillsets: candidate?.skillsets || [],
            past_companies: candidate?.past_companies || [],
            general_notes: candidate?.general_notes,
            is_active: candidate?.is_active,
            is_user: isUser,
            notes: item.notes,
            created_at: item.created_at,
            updated_at: item.updated_at,
            stage: item.hiring_stages
          };
        })
      );

      console.log('Processed candidates:', candidatesWithUserStatus);
      return candidatesWithUserStatus.filter(c => c.id); // Filter out any null candidates
    },
    refetchInterval: 30000, // Refetch every 30 seconds to keep user status updated
  });
};
