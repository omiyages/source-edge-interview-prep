
// ABOUTME: Custom hook for fetching and managing kanban board data including candidates and hiring stages
// ABOUTME: Handles data transformation and user status checking for the hiring pipeline

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HiringStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

export interface Candidate {
  id: string;
  full_name: string;
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
  applications?: Array<{
    id: string;
    stage_id: string;
    applied_company: string | null;
    applied_job_title: string | null;
    created_at: string;
    updated_at: string;
    moved_at: string | null;
    is_active: boolean;
  }>;
}

export const useHiringStages = () => {
  return useQuery({
    queryKey: ['hiring-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiring_stages')
        .select('*')
        .order('stage_order');
      
      if (error) throw error;
      
      // Map the database fields to our interface, using stage_order as order_index
      return data.map(stage => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order_index: stage.stage_order // Use stage_order from database
      })) as HiringStage[];
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
          is_active,
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
            full_name: candidate?.full_name || '',
            email: candidate?.email || null,
            phone_number: candidate?.phone_number || null,
            linkedin_profile: candidate?.linkedin_profile || null,
            current_company: candidate?.current_company || null,
            years_of_experience: candidate?.years_of_experience || null,
            salary: candidate?.salary || null,
            skillsets: candidate?.skillsets || [],
            past_companies: candidate?.past_companies || [],
            general_notes: candidate?.general_notes || null,
            is_active: item.is_active && (candidate?.is_active ?? true), // Both pipeline and candidate must be active
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
