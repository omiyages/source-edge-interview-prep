
import { useMemo } from 'react';
import { Candidate } from './useKanbanData';

export interface StageCandidate extends Candidate {
  applicationId: string;
  applied_company: string | null;
  applied_job_title: string | null;
  application_created_at: string;
  moved_at: string;
  is_active: boolean;
}

export const useKanbanStageData = (candidates: Candidate[]) => {
  const stageData = useMemo(() => {
    const stageMap = new Map<string, StageCandidate[]>();
    
    console.log('🔍 Processing candidates for stage mapping:', candidates.length);
    
    candidates.forEach(candidate => {
      console.log(`👤 Processing candidate: ${candidate.full_name}`, {
        id: candidate.id,
        applicationsCount: candidate.applications?.length || 0
      });
      
      if (candidate.applications && candidate.applications.length > 0) {
        candidate.applications.forEach(application => {
          console.log(`📋 Processing application:`, {
            id: application.id,
            stage_id: application.stage_id,
            is_active: application.is_active,
            candidate_name: candidate.full_name
          });
          
          if (application.is_active) {
            const stageId = application.stage_id;
            
            if (!stageMap.has(stageId)) {
              stageMap.set(stageId, []);
            }
            
            const stageCandidate: StageCandidate = {
              ...candidate,
              applicationId: application.id,
              applied_company: application.applied_company,
              applied_job_title: application.applied_job_title,
              application_created_at: application.created_at,
              moved_at: application.moved_at || application.updated_at,
              is_active: application.is_active,
            };
            
            stageMap.get(stageId)!.push(stageCandidate);
            console.log(`✅ Added candidate ${candidate.full_name} to stage ${stageId}`);
          }
        });
      }
    });
    
    // Log final stage mapping
    stageMap.forEach((candidates, stageId) => {
      console.log(`📊 Stage ${stageId} has ${candidates.length} candidates`);
    });
    
    return stageMap;
  }, [candidates]);
  
  const getCandidatesForStage = (stageId: string): StageCandidate[] => {
    const stageCandidates = stageData.get(stageId) || [];
    console.log(`🔍 Getting candidates for stage ${stageId}: ${stageCandidates.length} found`);
    return stageCandidates;
  };
  
  return {
    getCandidatesForStage,
    stageData
  };
};
