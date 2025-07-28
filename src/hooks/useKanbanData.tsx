
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HiringStage {
  id: string;
  name: string;
  stage_order: number;
  color: string;
}

export interface CandidateApplication {
  id: string;
  stage_id: string;
  applied_company: string | null;
  applied_job_title: string | null;
  created_at: string;
  updated_at: string;
  moved_at: string;
  is_active: boolean;
  candidate_id: string;
}

export interface Candidate {
  id: string;
  email: string | null;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
  phone_number: string | null;
  salary: number | null;
  past_companies: string[] | null;
  general_notes: string | null;
  is_user: boolean;
  user_id: string | null;
  applications?: CandidateApplication[];
}

export const useHiringStages = () => {
  return useQuery({
    queryKey: ['hiring-stages'],
    queryFn: async () => {
      console.log('🔍 Fetching hiring stages...');
      const { data, error } = await supabase
        .from('hiring_stages')
        .select('*')
        .order('stage_order');
      
      if (error) {
        console.error('❌ Error fetching hiring stages:', error);
        throw error;
      }
      
      console.log('✅ Hiring stages loaded:', data?.length || 0);
      return data as HiringStage[];
    },
  });
};

export const useCandidatesWithPipeline = (showInactive: boolean = false) => {
  return useQuery({
    queryKey: ['candidates-with-pipeline', showInactive],
    queryFn: async () => {
      console.log('🔍 Fetching candidates with pipeline data...', { showInactive });
      
      // Get all candidates from the new candidates table
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*');
      
      if (candidatesError) {
        console.error('❌ Error fetching candidates:', candidatesError);
        throw candidatesError;
      }

      // Get pipeline applications based on showInactive flag
      const applicationsQuery = supabase
        .from('candidate_pipeline')
        .select('*');
      
      if (!showInactive) {
        applicationsQuery.eq('is_active', true);
      }
      
      const { data: applications, error: applicationsError } = await applicationsQuery;
      
      if (applicationsError) {
        console.error('❌ Error fetching pipeline applications:', applicationsError);
        throw applicationsError;
      }

      console.log('📊 Raw data:', {
        candidates: candidates?.length || 0,
        applications: applications?.length || 0,
        activeApplications: applications?.filter(app => app.is_active).length || 0,
        inactiveApplications: applications?.filter(app => !app.is_active).length || 0,
        showInactive
      });

      // Map applications to candidates using candidate_id
      const candidatesWithApplications = candidates?.map(candidate => {
        const candidateApplications = applications?.filter(app => 
          app.candidate_id === candidate.id
        ) || [];
        
        return {
          ...candidate,
          applications: candidateApplications
        };
      }) || [];

      console.log('✅ Candidates with applications processed:', candidatesWithApplications.length);
      candidatesWithApplications.forEach(candidate => {
        if (candidate.applications?.length > 0) {
          const activeApps = candidate.applications.filter(app => app.is_active).length;
          const inactiveApps = candidate.applications.filter(app => !app.is_active).length;
          console.log(`👤 ${candidate.full_name}: ${activeApps} active, ${inactiveApps} inactive applications`);
        }
      });
      
      return candidatesWithApplications as Candidate[];
    },
  });
};

// Legacy hook for backward compatibility - will be removed after refactoring
export const useKanbanHelpers = (candidates: Candidate[]) => {
  const getCandidatesForStage = useCallback((stageId: string) => {
    console.log(`🔍 Getting candidates for stage: ${stageId}`);
    const applications: any[] = [];
    
    candidates.forEach(candidate => {
      if (candidate.applications && candidate.applications.length > 0) {
        candidate.applications.forEach(application => {
          if (application.stage_id === stageId && application.is_active) {
            console.log(`📋 Adding candidate ${candidate.full_name} to stage ${stageId}`);
            applications.push({
              ...candidate,
              applicationId: application.id,
              applied_company: application.applied_company,
              applied_job_title: application.applied_job_title,
              application_created_at: application.created_at,
              moved_at: application.moved_at || application.updated_at,
              is_active: application.is_active,
            });
          }
        });
      }
    });
    
    console.log(`📊 Found ${applications.length} applications for stage ${stageId}`);
    return applications;
  }, [candidates]);

  const getUnassignedCandidates = useCallback(() => {
    console.log('🔍 Getting unassigned candidates...');
    return [];
  }, []);

  return useMemo(() => ({
    getCandidatesForStage,
    getUnassignedCandidates,
  }), [getCandidatesForStage, getUnassignedCandidates]);
};
