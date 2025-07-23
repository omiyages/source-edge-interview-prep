
import { useState, useMemo } from 'react';
import { Candidate } from './useKanbanData';

export const useKanbanFilters = (candidates: Candidate[]) => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Extract unique roles and companies from candidates data
  const { availableRoles, availableCompanies } = useMemo(() => {
    const rolesSet = new Set<string>();
    const companiesSet = new Set<string>();

    candidates.forEach(candidate => {
      // Add current company if it exists
      if (candidate.current_company) {
        companiesSet.add(candidate.current_company);
      }

      // Add roles and companies from applications
      candidate.applications?.forEach(app => {
        if (app.applied_job_title) {
          rolesSet.add(app.applied_job_title);
        }
        if (app.applied_company) {
          companiesSet.add(app.applied_company);
        }
      });
    });

    return {
      availableRoles: Array.from(rolesSet).sort(),
      availableCompanies: Array.from(companiesSet).sort(),
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const roleMatch = roleFilter === 'all' || 
        candidate.applications?.some(app => 
          app.applied_job_title === roleFilter
        );

      const companyMatch = companyFilter === 'all' || 
        candidate.current_company === companyFilter ||
        candidate.applications?.some(app => 
          app.applied_company === companyFilter
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
    availableRoles,
    availableCompanies,
  };
};
