
// ABOUTME: Hooks for fetching and managing Kanban board data including stages and candidates
// ABOUTME: Provides real-time data with automatic user status checking and pipeline management

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HiringStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

export interface Application {
  id: string;
  stage_id: string;
  applied_company: string | null;
  applied_job_title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  moved_at: string | null;
}

export interface Candidate {
  id: string;
  pipeline_id?: string;
  stage_id?: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  salary: number | null;
  skillsets: string[] | null;
  past_companies: string[] | null;
  general_notes: string | null;
  is_active: boolean;
  is_user: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stage: HiringStage | null;
  applications?: Application[];
}

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
          candidates!candidate_pipeline_candidate_id_fkey (
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
             color,
             order_index
           ),
           is_active,
           applied_company,
           applied_job_title,
           moved_at
         `);
       
       if (!includeInactive) {
         query = query.eq('is_active', true);
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
             id: candidate?.id || '',
             pipeline_id: item.id,
             stage_id: item.stage_id,
             full_name: candidate?.full_name || null,
             email: candidate?.email || null,
             phone_number: candidate?.phone_number || null,
             linkedin_profile: candidate?.linkedin_profile || null,
             current_company: candidate?.current_company || null,
             years_of_experience: candidate?.years_of_experience || null,
             salary: candidate?.salary || null,
             skillsets: candidate?.skillsets || [],
             past_companies: candidate?.past_companies || [],
             general_notes: candidate?.general_notes || null,
             is_active: (candidate?.is_active ?? true) && (item.is_active ?? true),
             is_user: isUser,
             notes: item.notes,
             created_at: item.created_at,
             updated_at: item.updated_at,
             stage: item.hiring_stages,
             applications: [{
               id: item.id,
               stage_id: item.stage_id,
               applied_company: item.applied_company,
               applied_job_title: item.applied_job_title,
               is_active: item.is_active ?? true,
               created_at: item.created_at,
               updated_at: item.updated_at,
               moved_at: item.moved_at
             }]
           };
        })
      );

      // Filter based on includeInactive setting
      const filteredCandidates = includeInactive 
        ? candidatesWithUserStatus.filter(c => c.id)
        : candidatesWithUserStatus.filter(c => c.id && c.is_active);

      console.log('Processed candidates:', filteredCandidates);
      return filteredCandidates;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for better real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};
