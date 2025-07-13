import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HiringStage {
  id: string;
  name: string;
  stage_order: number;
  color: string;
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

export interface CandidateApplication {
  id: string;
  stage_id: string;
  applied_company: string | null;
  applied_job_title: string | null;
  created_at: string;
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
      return data as HiringStage[];
    },
  });
};

export const useCandidatesWithPipeline = () => {
  return useQuery({
    queryKey: ['candidates-with-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          candidate_pipeline (
            id,
            stage_id,
            applied_company,
            applied_job_title,
            created_at
          )
        `)
        .eq('role', 'user');
      
      if (error) throw error;
      
      return data.map(candidate => ({
        ...candidate,
        applications: candidate.candidate_pipeline || [],
      })) as Candidate[];
    },
  });
};

export const useKanbanHelpers = (candidates: Candidate[]) => {
  const getCandidatesForStage = (stageId: string) => {
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
    return applications;
  };

  const getUnassignedCandidates = () => {
    return candidates.filter(candidate => !candidate.applications || candidate.applications.length === 0);
  };

  return {
    getCandidatesForStage,
    getUnassignedCandidates,
  };
};