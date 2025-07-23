
import { useState, useMemo } from 'react';
import { Candidate } from './useKanbanData';

export const useKanbanFilters = (candidates: Candidate[]) => {
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const roleMatch = !roleFilter || 
        candidate.applications?.some(app => 
          app.applied_job_title?.toLowerCase().includes(roleFilter.toLowerCase())
        );

      const companyMatch = !companyFilter || 
        candidate.current_company?.toLowerCase().includes(companyFilter.toLowerCase()) ||
        candidate.applications?.some(app => 
          app.applied_company?.toLowerCase().includes(companyFilter.toLowerCase())
        );

      return roleMatch && companyMatch;
    });
  }, [candidates, roleFilter, companyFilter]);

  return {
    roleFilter,
    companyFilter,
    setRoleFilter,
    setCompanyFilter,
    filteredCandidates,
  };
};
