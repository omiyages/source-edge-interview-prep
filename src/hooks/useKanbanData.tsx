
import { useQuery } from '@tanstack/react-query';
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
}

export interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
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

export const useCandidatesWithPipeline = () => {
  return useQuery({
    queryKey: ['candidates-with-pipeline'],
    queryFn: async () => {
      console.log('🔍 Fetching candidates with pipeline data...');
      
      // First get all candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      
      if (candidatesError) {
        console.error('❌ Error fetching candidates:', candidatesError);
        throw candidatesError;
      }

      // Then get all pipeline applications
      const { data: applications, error: applicationsError } = await supabase
        .from('candidate_pipeline')
        .select('*');
      
      if (applicationsError) {
        console.error('❌ Error fetching pipeline applications:', applicationsError);
        throw applicationsError;
      }

      console.log('📊 Raw data:', {
        candidates: candidates?.length || 0,
        applications: applications?.length || 0
      });

      // Map applications to candidates
      const candidatesWithApplications = candidates?.map(candidate => ({
        ...candidate,
        applications: applications?.filter(app => app.candidate_id === candidate.id) || []
      })) || [];

      console.log('✅ Candidates with applications processed:', candidatesWithApplications.length);
      candidatesWithApplications.forEach(candidate => {
        if (candidate.applications?.length > 0) {
          console.log(`👤 ${candidate.email}: ${candidate.applications.length} applications`);
        }
      });
      
      return candidatesWithApplications as Candidate[];
    },
  });
};

export const useKanbanHelpers = (candidates: Candidate[]) => {
  const getCandidatesForStage = (stageId: string) => {
    console.log(`🔍 Getting candidates for stage: ${stageId}`);
    const applications: any[] = [];
    
    candidates.forEach(candidate => {
      candidate.applications?.forEach(application => {
        if (application.stage_id === stageId) {
          applications.push({
            ...candidate,
            applicationId: application.id,
            applied_company: application.applied_company,
            applied_job_title: application.applied_job_title,
            application_created_at: application.created_at,
          });
        }
      });
    });
    
    console.log(`📊 Found ${applications.length} applications for stage ${stageId}`);
    return applications;
  };

  const getUnassignedCandidates = () => {
    const unassigned = candidates.filter(candidate => !candidate.applications || candidate.applications.length === 0);
    console.log(`📊 Found ${unassigned.length} unassigned candidates`);
    return unassigned;
  };

  return {
    getCandidatesForStage,
    getUnassignedCandidates,
  };
};
