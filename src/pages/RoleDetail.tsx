import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationHeader } from '@/components/NavigationHeader';
import { fetchRoleBySlug, deleteRole } from '@/services/rolesService';
import { fetchRecommendedCourseForRole, type CourseMatch } from '@/services/coursesService';
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
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Briefcase,
  Monitor,
  Languages,
  Calendar,
  Edit,
  Trash2,
  Send,
  Download,
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
  active: 'bg-green-900/40 text-green-400',
  closed: 'bg-red-900/40 text-red-400',
  draft: 'bg-neutral-800 text-neutral-300',
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function compactRichTextForPdf(html: string | null): string {
  if (!html) return '';
  return html
    // Remove common Quill empty lines
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<div><br><\/div>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '')
    // Collapse excessive breaks
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br/>');
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

  // Find courses that have this role's job title in attached_jobs.
  // Use company-scoped query first to avoid scanning all courses.
  const { data: recommendedCourse } = useQuery<CourseMatch | null>({
    queryKey: ['role-course', role?.id],
    queryFn: async () => {
      if (!role) return null;
      return fetchRecommendedCourseForRole(role.company, role.job_title);
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
      navigate('/jobs');
    }).catch((err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    });
  };

  const summary = role ? parseAiSummary(role.ai_summary) : null;
  const companyInfo = useMemo(() => (role ? findCompanyInfo(role.company) : null), [role]);

  const handleDownloadPdf = () => {
    if (!role) return;

    const headerMetaParts = [
      role.company,
      role.location,
      role.working_style,
    ].filter(Boolean);

    const headerMetaLine = headerMetaParts.map((part) => escapeHtml(part)).join(' / ');

    const contentHtml = `
      <html>
        <head>
          <title>${escapeHtml(role.job_title)} - ${escapeHtml(role.company)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 0; line-height: 1.26; font-size: 14px; }
            @page { margin: 18mm 12mm 16mm; }
            .pdf-brand {
              position: fixed;
              top: 8px;
              right: 20px;
              font-size: 10px;
              color: #6b7280;
              font-weight: 600;
              letter-spacing: 0.02em;
              z-index: 9999;
            }
            .pdf-header {
              text-align: center;
              padding: 20px 20px 10px;
            }
            .pdf-header h1 {
              font-size: 22px;
              line-height: 1.2;
              margin: 0 0 8px;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .pdf-header .subtitle {
              font-size: 11px;
              font-weight: 600;
              color: #2f2f2f;
              margin: 0;
              line-height: 1.3;
            }
            .pdf-content {
              padding: 12px 20px 16px;
              font-size: 14px;
            }
            h2 { font-size: 21px; margin: 4px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 1px; line-height: 1.15; }
            .meta { margin-bottom: 8px; color: #444; font-size: 12px; }
            .meta div { margin: 1px 0; }
            .section { margin-top: 18px; }
            .pdf-content > .section:first-child { margin-top: 6px; }
            ul, ol { margin: 0 0 0 12px; padding-left: 6px; }
            li { margin: 0; line-height: 1.26; font-size: 14px; }
            .rich * { margin: 0; padding: 0; line-height: 1.26; font-size: 14px; }
            .rich p { margin: 0 !important; line-height: 1.26; font-size: 14px; }
            .rich p + p { margin-top: 1px !important; }
            .rich br { display: block; content: ""; margin: 0; line-height: 1; }
            .rich h1, .rich h2, .rich h3, .rich h4, .rich h5, .rich h6 { margin: 2px 0 1px !important; }
            .rich ul, .rich ol { margin: 0 0 0 12px !important; padding-left: 6px !important; }
            .rich li { margin: 0 !important; }
          </style>
        </head>
        <body>
          <div class="pdf-brand">Presented by Source Edge</div>
          <header class="pdf-header">
            <h1>${escapeHtml(role.job_title)}</h1>
            <p class="subtitle">${headerMetaLine}</p>
          </header>
          <div class="pdf-content">
            ${role.job_description ? `<div class="section rich"><h2>Job Description</h2>${compactRichTextForPdf(role.job_description)}</div>` : ''}
            ${role.requirements ? `<div class="section rich"><h2>Requirements</h2>${compactRichTextForPdf(role.requirements)}</div>` : ''}
            ${role.nice_to_haves ? `<div class="section rich"><h2>Nice to Haves</h2>${compactRichTextForPdf(role.nice_to_haves)}</div>` : ''}
            ${role.benefits ? `<div class="section rich"><h2>Benefits</h2>${compactRichTextForPdf(role.benefits)}</div>` : ''}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to download the PDF.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(contentHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <NavigationHeader />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <NavigationHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-12 h-12 mx-auto text-neutral-500 mb-3" />
            <h2 className="text-xl font-semibold text-neutral-400 mb-2">Role not found</h2>
            <p className="text-sm text-neutral-400 mb-4">This position may have been removed or the link is incorrect.</p>
            <Button asChild variant="outline">
              <Link to="/jobs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Back link */}
        <Link
          to="/jobs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Open Jobs
        </Link>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — Job details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header card */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-6">
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
                    <span className="inline-flex items-center gap-1.5">
                      <Languages className="w-4 h-4" />
                      Japanese: {role.japanese_level || 'None'}
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
                      <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-medium">
                        {role.division}
                      </span>
                    )}
                    <span className="bg-neutral-800 text-neutral-400 text-xs px-2.5 py-1 rounded-full">
                      {role.working_style}
                    </span>
                    <span className="bg-indigo-900/40 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium">
                      Japanese: {role.japanese_level || 'None'}
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
                    <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {summary && (
                <div className="mt-4 bg-neutral-950 border border-neutral-800 rounded-md px-4 py-3">
                  <ul className="text-sm text-neutral-300 space-y-1 list-disc list-inside">
                    {summary.candidate && <li>{summary.candidate}</li>}
                    {summary.responsibility && <li>{summary.responsibility}</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* Content sections */}
            {role.job_description && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Job Description</h2>
                <RichTextDisplay content={role.job_description} className="text-sm text-neutral-300" />
              </div>
            )}

            {role.requirements && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Requirements</h2>
                <RichTextDisplay content={role.requirements} className="text-sm text-neutral-300" />
              </div>
            )}

            {role.nice_to_haves && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Nice to Haves</h2>
                <RichTextDisplay content={role.nice_to_haves} className="text-sm text-neutral-300" />
              </div>
            )}

            {role.benefits && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">Benefits</h2>
                <RichTextDisplay content={role.benefits} className="text-sm text-neutral-300" />
              </div>
            )}
          </div>

          {/* Right column — Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-8 space-y-5">
              {/* Apply button */}
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm p-5 text-center">
                <Button
                  className="w-full btn-purple-gradient text-base h-12 font-semibold"
                  onClick={() => setApplyDialogOpen(true)}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Typically responds within 48 hours
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleDownloadPdf}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
              </div>

              {/* Recommended Course */}
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm overflow-hidden">
                {recommendedCourse ? (
                  <>
                    {/* Course banner */}
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 px-5 py-4">
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
                        className="w-full border-cyan-600 text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-300"
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
                    <BookOpen className="w-10 h-10 mx-auto text-neutral-500 mb-2" />
                    <p className="text-sm font-medium text-neutral-400">No Assigned Course</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      There is no preparation course linked to this role yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Company info */}
              {companyInfo && (
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm overflow-hidden">
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
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
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
