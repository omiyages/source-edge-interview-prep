import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationHeader } from '@/components/NavigationHeader';
import { fetchRoleBySlug, deleteRole } from '@/services/rolesService';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RoleForm } from '@/components/RoleForm';
import { ApplyRoleDialog } from '@/components/ApplyRoleDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LazyImage } from '@/components/ui/lazy-image';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Briefcase,
  Monitor,
  Calendar,
  Edit,
  Trash2,
  Send,
  BookOpen,
  ArrowRight,
  Globe,
  Users,
} from 'lucide-react';
import { useState, useMemo } from 'react';

/** Static company directory — matches the data on the /company page. */
const COMPANIES_DIRECTORY: {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  industry: string;
  location: string;
  founded: string;
  image: string;
  divisions: string[];
}[] = [
  {
    id: 'woven',
    name: 'Woven by Toyota',
    aliases: ['woven by toyota', 'woven', 'toyota'],
    description:
      "Toyota's mobility technology subsidiary, developing vehicle operating systems, automated driving, advanced safety technologies, and smart city initiatives.",
    industry: 'Automotive Software',
    location: 'Global',
    founded: '2021',
    image: '/woven-office-image.jpg',
    divisions: ['ADAS', 'Arene', 'Woven City', 'Enterprise Technology', 'Dojo'],
  },
];

function findCompanyInfo(companyName: string) {
  const lower = companyName.toLowerCase();
  return COMPANIES_DIRECTORY.find(
    (c) => c.name.toLowerCase() === lower || c.aliases.some((a) => lower.includes(a))
  ) ?? null;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
};

function parseAiSummary(raw: string | null): { candidate: string; responsibility: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const candidate = (parsed.candidate || '').trim();
    const responsibility = (parsed.responsibility || '').trim();
    if (!candidate && !responsibility) return null;
    return { candidate, responsibility };
  } catch {
    if (raw.trim()) return { candidate: raw.trim(), responsibility: '' };
    return null;
  }
}

interface CourseMatch {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
}

const RoleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role', slug],
    queryFn: () => fetchRoleBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Find courses that have this role's job_title in their attached_jobs.
  // Note: Supabase .contains() breaks when values have commas, so we fetch
  // courses with attached_jobs and match client-side.
  const { data: recommendedCourse } = useQuery<CourseMatch | null>({
    queryKey: ['role-course', role?.id],
    queryFn: async () => {
      if (!role) return null;

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, company, attached_jobs')
        .not('attached_jobs', 'is', null);

      if (!courses || courses.length === 0) return null;

      const jobTitle = role.job_title.trim().toLowerCase();

      const match = courses.find((c) =>
        Array.isArray(c.attached_jobs) &&
        c.attached_jobs.some((j: string) => j.trim().toLowerCase() === jobTitle)
      );

      return match ? ({ id: match.id, title: match.title, description: match.description, company: match.company } as CourseMatch) : null;
    },
    enabled: !!role,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const handleDelete = () => {
    if (!role) return;
    if (!window.confirm(`Are you sure you want to delete "${role.job_title}" at ${role.company}?`)) return;
    deleteRole(role.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role Deleted', description: 'The role has been removed.' });
      navigate('/roles');
    }).catch((err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    });
  };

  const summary = role ? parseAiSummary(role.ai_summary) : null;
  const companyInfo = useMemo(() => (role ? findCompanyInfo(role.company) : null), [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationHeader />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Role not found</h2>
            <p className="text-sm text-gray-500 mb-4">This position may have been removed or the link is incorrect.</p>
            <Button asChild variant="outline">
              <Link to="/roles">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Roles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Back link */}
        <Link
          to="/roles"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Open Positions
        </Link>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — Job details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-foreground">{role.job_title}</h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {role.company}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {role.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor className="w-4 h-4" />
                      {role.working_style}
                    </span>
                    {role.division && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {role.division}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Posted {new Date(role.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {role.division && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {role.division}
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                      {role.working_style}
                    </span>
                    {isAdmin && role.status !== 'active' && (
                      <Badge className={`${statusColors[role.status]} border-0 text-xs`}>
                        {role.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {summary && (
                <div className="mt-4 bg-gray-50 border border-gray-100 rounded-md px-4 py-3">
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    {summary.candidate && <li>{summary.candidate}</li>}
                    {summary.responsibility && <li>{summary.responsibility}</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* Content sections */}
            {role.job_description && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Job Description</h2>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: role.job_description }}
                />
              </div>
            )}

            {role.requirements && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Requirements</h2>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: role.requirements }}
                />
              </div>
            )}

            {role.nice_to_haves && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Nice to Haves</h2>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: role.nice_to_haves }}
                />
              </div>
            )}

            {role.benefits && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Benefits</h2>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: role.benefits }}
                />
              </div>
            )}
          </div>

          {/* Right column — Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-8 space-y-5">
              {/* Apply button */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 text-center">
                <Button
                  className="w-full btn-purple-gradient text-base h-12 font-semibold"
                  onClick={() => setApplyDialogOpen(true)}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Apply for this Role
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Typically responds within 48 hours
                </p>
              </div>

              {/* Recommended Course */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {recommendedCourse ? (
                  <>
                    {/* Course banner */}
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-5 py-4">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white bg-white/20 rounded px-2 py-0.5 mb-2">
                        Recommended Course
                      </span>
                      <h3 className="text-white font-semibold text-base leading-tight">
                        {recommendedCourse.title}
                      </h3>
                    </div>

                    <div className="p-5 space-y-3">
                      {recommendedCourse.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {recommendedCourse.description}
                        </p>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                      >
                        <Link to={`/course/${slugify(recommendedCourse.title)}`}>
                          View Course Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-500">No Assigned Course</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      There is no preparation course linked to this role yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Company info */}
              {companyInfo && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                  {companyInfo.image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <LazyImage
                        src={companyInfo.image}
                        alt={`${companyInfo.name} office`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-foreground text-base">{companyInfo.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {companyInfo.description}
                    </p>

                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{companyInfo.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{companyInfo.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Founded {companyInfo.founded}</span>
                      </div>
                    </div>

                    {companyInfo.divisions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {companyInfo.divisions.map((d) => (
                          <Badge key={d} variant="outline" className="text-[10px] px-1.5 py-0">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <Link to={`/company/${companyInfo.id}`}>
                        Learn More About {companyInfo.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Omiyages. All rights reserved.
        </div>
      </footer>

      {/* Apply Dialog */}
      <ApplyRoleDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        role={role}
      />

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <RoleForm
            role={role}
            onSuccess={() => {
              setEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['role', slug] });
              queryClient.invalidateQueries({ queryKey: ['roles'] });
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleDetail;
