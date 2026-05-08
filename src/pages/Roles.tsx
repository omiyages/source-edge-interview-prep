import React, { Suspense, useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavigationHeader } from '@/components/NavigationHeader';
import { RolesSidebarFilters } from '@/components/RolesSidebarFilters';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchRoles, deleteRole } from '@/services/rolesService';
import type { Role } from '@/types/role';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  Search,
  Plus,
  Upload,
  Briefcase,
  Edit,
  Trash2,
  Archive,
} from 'lucide-react';

/** Build the URL path for a role detail page. Falls back to id if no slug. */
function roleHref(role: Role): string {
  const candidate = (role.slug || role.id || '').trim();
  const isSafeSegment = /^[a-z0-9][a-z0-9-]{0,119}$/i.test(candidate);
  return isSafeSegment ? `/job/${candidate}` : '/roles';
}

/** Parse the ai_summary JSON string into candidate + responsibility lines. */
function parseAiSummary(raw: string | null): { candidate: string; responsibility: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const candidate = (parsed.candidate || '').trim();
    const responsibility = (parsed.responsibility || '').trim();
    if (!candidate && !responsibility) return null;
    return { candidate, responsibility };
  } catch {
    // Legacy plain-text fallback
    if (raw.trim()) return { candidate: raw.trim(), responsibility: '' };
    return null;
  }
}

const ROLES_PER_PAGE = 10;
const RoleForm = React.lazy(() => import('@/components/RoleForm').then((module) => ({ default: module.RoleForm })));
const RoleCSVImport = React.lazy(() =>
  import('@/components/RoleCSVImport').then((module) => ({ default: module.RoleCSVImport }))
);

const statusColors: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400',
  closed: 'bg-red-900/40 text-red-400',
  draft: 'bg-neutral-800 text-neutral-300',
};

/** Company logo config — maps company names to a letter + colour scheme. */
const COMPANY_LOGOS: Record<string, { letter: string; bg: string; text: string; border: string }> = {
  'woven by toyota': { letter: 'W', bg: 'bg-[#EF3054]', text: 'text-white', border: 'border-[#EF3054]' },
  'geniee': { letter: 'G', bg: 'bg-[#FFDD4A]', text: 'text-gray-900', border: 'border-[#FFDD4A]' },
  '株式会社ジーニー': { letter: 'G', bg: 'bg-[#FFDD4A]', text: 'text-gray-900', border: 'border-[#FFDD4A]' },
  'shippio': { letter: 'S', bg: 'bg-[#000665]', text: 'text-white', border: 'border-[#000665]' },
  '株式会社shippio': { letter: 'S', bg: 'bg-[#000665]', text: 'text-white', border: 'border-[#000665]' },
  'meetsmore': { letter: 'M', bg: 'bg-[#5BC8AF]', text: 'text-gray-900', border: 'border-[#5BC8AF]' },
  '株式会社meetsmore': { letter: 'M', bg: 'bg-[#5BC8AF]', text: 'text-gray-900', border: 'border-[#5BC8AF]' },
  'linkx': { letter: 'L', bg: 'bg-[#A14EBF]', text: 'text-white', border: 'border-[#A14EBF]' },
  '株式会社linkx': { letter: 'L', bg: 'bg-[#A14EBF]', text: 'text-white', border: 'border-[#A14EBF]' },
  'givery': { letter: 'G', bg: 'bg-[#FF7D00]', text: 'text-white', border: 'border-[#FF7D00]' },
  '株式会社givery': { letter: 'G', bg: 'bg-[#FF7D00]', text: 'text-white', border: 'border-[#FF7D00]' },
};

function companyLogo(company: string) {
  const key = company.toLowerCase();
  return COMPANY_LOGOS[key] || { letter: company.charAt(0).toUpperCase(), bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' };
}

const Roles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, rolesRlsReady } = useAuth();
  const location = useLocation();
  const isAliasRoute = location.pathname.startsWith('/roles');

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company'>('newest');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  /** Admin-only: list only closed roles (default board hides closed). */
  const [adminViewClosedJobs, setAdminViewClosedJobs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Fetch roles — wait for Clerk JWT when signed in so RLS returns admin-visible rows (incl. closed), not anon-only active rows.
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles', user?.id ?? 'anon'],
    queryFn: fetchRoles,
    enabled: rolesRlsReady,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
  const { options: roleTypeOptions = [] } = useDropdownOptions('role');

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role Deleted', description: 'The role has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Base list: guests/members see active only; admins see open board (non-closed) or closed-only when toggled
  const baseRoles = useMemo(() => {
    const isClosed = (r: Role) => String(r.status ?? '').trim().toLowerCase() === 'closed';
    const isActive = (r: Role) => String(r.status ?? '').trim().toLowerCase() === 'active';
    if (!isAdmin) return roles.filter(isActive);
    if (adminViewClosedJobs) return roles.filter(isClosed);
    return roles.filter((r) => !isClosed(r));
  }, [roles, isAdmin, adminViewClosedJobs]);

  // Derived filter options with counts
  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, number>();
    baseRoles.forEach((r) => map.set(r.company, (map.get(r.company) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [baseRoles]);

  const uniqueDivisions = useMemo(() => {
    const map = new Map<string, number>();
    baseRoles.forEach((r) => {
      const d = r.division || 'Unspecified';
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [baseRoles]);

  const uniqueRoleTypes = useMemo(() => {
    const map = new Map<string, number>();

    roleTypeOptions.forEach((roleType) => {
      const roleTypeLower = roleType.toLowerCase();
      const count = baseRoles.filter((r) => {
        if (r.role_type && r.role_type.trim()) {
          return r.role_type.trim().toLowerCase() === roleTypeLower;
        }
        return r.job_title.toLowerCase().includes(roleTypeLower);
      }).length;
      if (count > 0) map.set(roleType, count);
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [baseRoles, roleTypeOptions]);

  const uniqueLocations = useMemo(() => {
    const map = new Map<string, number>();
    baseRoles.forEach((r) => map.set(r.location, (map.get(r.location) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [baseRoles]);

  const uniqueStyles = useMemo(() => {
    const map = new Map<string, number>();
    baseRoles.forEach((r) => map.set(r.working_style, (map.get(r.working_style) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [baseRoles]);

  // Filtering
  const filteredRoles = useMemo(() => {
    let list = baseRoles;

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.job_title.toLowerCase().includes(s) ||
          r.company.toLowerCase().includes(s) ||
          r.location.toLowerCase().includes(s) ||
          (r.division || '').toLowerCase().includes(s)
      );
    }

    if (companyFilter !== 'all') list = list.filter((r) => r.company === companyFilter);
    if (selectedDivisions.length > 0) list = list.filter((r) => selectedDivisions.includes(r.division || 'Unspecified'));
    if (selectedRoleTypes.length > 0) {
      list = list.filter((r) => {
        return selectedRoleTypes.some((roleType) => {
          const roleTypeLower = roleType.toLowerCase();
          if (r.role_type && r.role_type.trim()) {
            return r.role_type.trim().toLowerCase() === roleTypeLower;
          }
          return r.job_title.toLowerCase().includes(roleTypeLower);
        });
      });
    }
    if (selectedLocations.length > 0) list = list.filter((r) => selectedLocations.includes(r.location));
    if (selectedStyles.length > 0) list = list.filter((r) => selectedStyles.includes(r.working_style));
    if (isAdmin && statusFilter !== 'all' && !adminViewClosedJobs) {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Sort
    if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'company') list = [...list].sort((a, b) => a.company.localeCompare(b.company));

    return list;
  }, [
    baseRoles,
    searchTerm,
    companyFilter,
    selectedDivisions,
    selectedRoleTypes,
    selectedLocations,
    selectedStyles,
    statusFilter,
    sortBy,
    isAdmin,
    adminViewClosedJobs,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / ROLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ROLES_PER_PAGE;
  const paginatedRoles = useMemo(() => filteredRoles.slice(startIndex, startIndex + ROLES_PER_PAGE), [filteredRoles, startIndex]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDelete = (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete "${role.job_title}" at ${role.company}?`)) return;
    deleteMutation.mutate(role.id);
  };

  const toggleArr = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => {
      setCurrentPage(1);
      return prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val];
    });
  };

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setCompanyFilter('all');
    setSelectedDivisions([]);
    setSelectedRoleTypes([]);
    setSelectedLocations([]);
    setSelectedStyles([]);
    setStatusFilter('all');
    setAdminViewClosedJobs(false);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Seo
        title="Tech Jobs in Tokyo and Japan"
        description="Browse software engineering, machine learning, product, and other technical jobs in Tokyo and Japan for English-speaking and bilingual candidates."
        path="/jobs"
        noindex={isAliasRoute}
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Jobs', path: '/jobs' },
        ])}
      />
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar — Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <RolesSidebarFilters
              filters={{
                company: companyFilter,
                divisions: selectedDivisions,
                roleTypes: selectedRoleTypes,
                locations: selectedLocations,
                styles: selectedStyles,
                status: statusFilter,
              }}
              onCompanyChange={(v) => { setCompanyFilter(v); setCurrentPage(1); }}
              onDivisionToggle={(v) => toggleArr(selectedDivisions, v, setSelectedDivisions)}
              onRoleTypeToggle={(v) => toggleArr(selectedRoleTypes, v, setSelectedRoleTypes)}
              onLocationToggle={(v) => toggleArr(selectedLocations, v, setSelectedLocations)}
              onStyleToggle={(v) => toggleArr(selectedStyles, v, setSelectedStyles)}
              onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              onClearFilters={clearAllFilters}
              companies={uniqueCompanies}
              divisions={uniqueDivisions}
              roleTypes={uniqueRoleTypes}
              locations={uniqueLocations}
              styles={uniqueStyles}
              isAdmin={isAdmin}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {isAdmin && adminViewClosedJobs ? 'Closed Jobs' : 'Open Jobs'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isAdmin && adminViewClosedJobs
                      ? `Review ${baseRoles.length > 0 ? `${baseRoles.length} ` : ''}closed listings (not visible on the public job board).`
                      : `Browse ${baseRoles.length > 0 ? `${baseRoles.length} ` : ''}open software engineering, machine learning, product, and technical job listings across Tokyo and Japan for English-speaking and bilingual candidates.`}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Button
                      variant={adminViewClosedJobs ? 'secondary' : 'outline'}
                      onClick={() => {
                        setAdminViewClosedJobs((v) => !v);
                        setCurrentPage(1);
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {adminViewClosedJobs ? 'View Open Jobs' : 'View Closed Jobs'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Role
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Search + Sort */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles by title, keyword or ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-48 border-neutral-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Listings */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 border border-border rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-neutral-700 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-neutral-900">
                <Briefcase className="w-12 h-12 mx-auto text-neutral-500 mb-3" />
                <p className="text-lg font-semibold text-neutral-400">
                  {baseRoles.length === 0
                    ? isAdmin && adminViewClosedJobs
                      ? 'No closed jobs'
                      : 'No open jobs yet'
                    : isAdmin && adminViewClosedJobs
                      ? 'No closed jobs match your filters'
                      : 'No open jobs match your filters'}
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  {baseRoles.length === 0
                    ? isAdmin && adminViewClosedJobs
                      ? 'Closed roles you archive will appear here.'
                      : 'Create your first role or import from CSV.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {baseRoles.length === 0 && isAdmin && !adminViewClosedJobs && (
                  <div className="flex justify-center gap-3 mt-4">
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Role
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedRoles.map((role) => {
                    const logo = companyLogo(role.company);
                    const summary = parseAiSummary(role.ai_summary);
                    return (
                      <Link
                        key={role.id}
                        to={roleHref(role)}
                        className="block bg-neutral-900 rounded-lg border border-neutral-800 p-5 hover:shadow-md hover:border-neutral-700 transition-all group cursor-pointer"
                      >
                        {/* Top row: logo + title + badges + admin actions */}
                        <div className="flex items-start gap-4">
                          {/* Company Logo */}
                          <div
                            className={`w-12 h-12 rounded-full ${logo.bg} ${logo.text} ${logo.border} border-2 flex items-center justify-center shrink-0 font-bold text-lg`}
                          >
                            {logo.letter}
                          </div>

                          {/* Title + badges */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-foreground truncate">{role.job_title}</h3>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                              <span className="text-sm text-muted-foreground">{role.company}</span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                {role.working_style}
                              </span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="bg-indigo-900/40 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                Japanese: {role.japanese_level || 'None'}
                              </span>
                              {role.division && (
                                <>
                                  <span className="text-muted-foreground/40">•</span>
                                  <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {role.division}
                                  </span>
                                </>
                              )}
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-sm text-muted-foreground">{role.location}</span>
                              {isAdmin && role.status !== 'active' && (
                                <>
                                  <span className="text-muted-foreground/40">•</span>
                                  <Badge className={`${statusColors[role.status]} border-0 text-xs`}>
                                    {role.status}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Admin actions */}
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => { e.preventDefault(); setEditingRole(role); }}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => { e.preventDefault(); handleDelete(role); }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* AI Summary — aligned with the logo's left edge, hanging indent */}
                        {summary && (
                          <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                            {summary.candidate && (
                              <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                <span>{summary.candidate}</span>
                              </li>
                            )}
                            {summary.responsibility && (
                              <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                <span>{summary.responsibility}</span>
                              </li>
                            )}
                          </ul>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination — same style as Questions page */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &larr;
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        if (totalPages > 5 && pageNumber === 5 && currentPage < totalPages - 1) {
                          return (
                            <span key={pageNumber} className="px-3 py-1 text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className={currentPage === pageNumber ? 'bg-primary text-primary-foreground' : ''}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}

                      {totalPages > 5 && (
                        <Button
                          variant={currentPage === totalPages ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className={currentPage === totalPages ? 'bg-primary text-primary-foreground' : ''}
                        >
                          {totalPages}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        &rarr;
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Omiyages. All rights reserved.
        </div>
      </footer>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading role form…</div>}>
            <RoleForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading role form…</div>}>
            <RoleForm
              role={editingRole}
              onSuccess={() => setEditingRole(null)}
              onCancel={() => setEditingRole(null)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Roles from CSV
            </DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading import tool…</div>}>
            <RoleCSVImport onSuccess={() => setShowImportDialog(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Roles;
