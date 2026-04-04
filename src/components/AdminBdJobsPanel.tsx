// ABOUTME: BD helper — Target companies (Supabase) + Jobs tab (ATS fetch / draft import)
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseJobsFromCareersUrl } from "@/lib/ats/parseCareersUrl";
import type { ParsedJob } from "@/lib/ats/types";
import { createRole } from "@/services/rolesService";
import {
  createBdCompany,
  deleteBdCompany,
  listBdCompanies,
  updateBdCompanyParseResult,
  type BdCompanyRow,
} from "@/services/bdCompaniesService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { JapaneseLevel, RoleFormData, WorkingStyle } from "@/types/role";
import { TIMEZONE_CONFIG } from "@/config/timezone";
import { Building2, ExternalLink, ListPlus, Loader2, RefreshCw } from "lucide-react";

const BD_COMPANIES_QK = ["bd-companies"] as const;

function inferWorkingStyle(job: ParsedJob): WorkingStyle {
  const t = `${job.workplace_type || ""} ${job.description_plain || ""} ${job.location || ""}`.toLowerCase();
  if (/\b(remote|fully remote|wfh|work from home)\b/.test(t)) return "Remote";
  if (/\b(onsite|on-site|office)\b/.test(t) && !/\bhybrid\b/.test(t)) return "Onsite";
  return "Hybrid";
}

function mapJapanese(j: ParsedJob["japanese_level"]): JapaneseLevel {
  if (j === "Conversational" || j === "Business" || j === "Native" || j === "None") return j;
  return "None";
}

function toRoleDraft(job: ParsedJob, company: string): RoleFormData {
  return {
    job_title: job.title,
    role_type: job.role_category?.trim() || "",
    company: company.trim(),
    location: (job.location || "Japan").trim(),
    working_style: inferWorkingStyle(job),
    japanese_level: mapJapanese(job.japanese_level),
    division: (job.department || "").trim(),
    job_description: (job.description_plain || "").trim(),
    requirements: "",
    nice_to_haves: "",
    benefits: "",
    status: "draft",
  };
}

function formatLastParsed(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: TIMEZONE_CONFIG.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function atsBadgeClass(platform: string): string {
  switch (platform) {
    case "workable":
      return "bg-cyan-950/60 text-cyan-200 border border-cyan-800/80";
    case "lever":
      return "bg-violet-950/60 text-violet-200 border border-violet-800/80";
    case "teamtailor":
      return "bg-pink-950/60 text-pink-200 border border-pink-800/80";
    case "greenhouse":
      return "bg-emerald-950/60 text-emerald-200 border border-emerald-800/80";
    case "hrmos":
      return "bg-amber-950/60 text-amber-200 border border-amber-800/80";
    default:
      return "bg-neutral-800 text-neutral-300 border border-neutral-700";
  }
}

function atsLabel(platform: string | null): string {
  if (!platform) return "—";
  if (platform === "hrmos") return "HRMOS";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

interface AdminBdJobsPanelProps {
  userId: string;
}

export function AdminBdJobsPanel({ userId }: AdminBdJobsPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [bdSubTab, setBdSubTab] = useState<"company" | "jobs">("company");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCareersUrl, setNewCareersUrl] = useState("");
  const [parsingPending, setParsingPending] = useState(false);

  const [careersUrl, setCareersUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fetching, setFetching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [parseMeta, setParseMeta] = useState<{ platform: string; slug: string } | null>(null);
  const [jobs, setJobs] = useState<ParsedJob[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const {
    data: companies = [],
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery({
    queryKey: BD_COMPANIES_QK,
    queryFn: listBdCompanies,
  });

  const invalidateCompanies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BD_COMPANIES_QK });
  }, [queryClient]);

  const createMut = useMutation({
    mutationFn: () =>
      createBdCompany({
        name: newName.trim(),
        careers_url: newCareersUrl.trim(),
        created_by: userId,
      }),
    onSuccess: () => {
      invalidateCompanies();
      setAddOpen(false);
      setNewName("");
      setNewCareersUrl("");
      toast({ title: "Company added" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Could not add company", description: e.message });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteBdCompany,
    onSuccess: () => {
      invalidateCompanies();
      toast({ title: "Company removed" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Delete failed", description: e.message });
    },
  });

  const handleParseNewlyAdded = useCallback(async () => {
    const pending = companies.filter((c) => c.status === "pending");
    if (pending.length === 0) {
      toast({ title: "Nothing to parse", description: "All companies are already parsed, or the list is empty." });
      return;
    }
    setParsingPending(true);
    let ok = 0;
    let fail = 0;
    const now = new Date().toISOString();
    for (const row of pending) {
      try {
        const result = await parseJobsFromCareersUrl(row.careers_url);
        if (!result.success) {
          await updateBdCompanyParseResult(row.id, {
            jobs_count: 0,
            status: "error",
            last_parsed_at: now,
            parse_error: result.error ?? "Parse failed",
            ats_platform: result.platform ?? row.ats_platform,
          });
          fail += 1;
          continue;
        }
        await updateBdCompanyParseResult(row.id, {
          jobs_count: result.jobs.length,
          status: "parsed",
          last_parsed_at: now,
          parse_error: null,
          ats_platform: result.platform ?? row.ats_platform,
        });
        ok += 1;
      } catch (e) {
        await updateBdCompanyParseResult(row.id, {
          jobs_count: 0,
          status: "error",
          last_parsed_at: now,
          parse_error: e instanceof Error ? e.message : String(e),
        });
        fail += 1;
      }
    }
    invalidateCompanies();
    setParsingPending(false);
    toast({
      title: "Parse finished",
      description: `${ok} succeeded, ${fail} failed (${pending.length} pending companies).`,
    });
  }, [companies, invalidateCompanies, toast]);

  const goToJobsWithCompany = useCallback((c: BdCompanyRow) => {
    setCompanyName(c.name);
    setCareersUrl(c.careers_url);
    setJobs([]);
    setParseMeta(null);
    setParseError(null);
    setBdSubTab("jobs");
    toast({ title: "Jobs tab", description: `Prefilled: ${c.name}` });
  }, [toast]);

  const handleFetch = useCallback(async () => {
    setFetching(true);
    setParseError(null);
    setJobs([]);
    setParseMeta(null);
    try {
      const result = await parseJobsFromCareersUrl(careersUrl);
      if (!result.success) {
        setParseError(
          result.error ||
            "Could not load jobs. Some boards block browser requests (e.g. Workable); try Greenhouse or Lever URLs.",
        );
        return;
      }
      setJobs(result.jobs);
      if (result.platform && result.slug) {
        setParseMeta({ platform: result.platform, slug: result.slug });
      }
      if (result.jobs.length === 0) {
        toast({ title: "No open roles found", description: "The board responded but returned zero listings." });
      }
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  }, [careersUrl, toast]);

  const handleImport = useCallback(
    async (job: ParsedJob) => {
      const company = companyName.trim();
      if (!company) {
        toast({ variant: "destructive", title: "Company name required", description: "Used for the role record and slug." });
        return;
      }

      setImportingId(job.external_id);
      try {
        await createRole(toRoleDraft(job, company), userId);
        toast({ title: "Draft role created", description: job.title });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setImportingId(null);
      }
    },
    [companyName, userId, toast],
  );

  const confirmDelete = (c: BdCompanyRow) => {
    if (typeof window !== "undefined" && !window.confirm(`Remove “${c.name}” from target companies?`)) return;
    deleteMut.mutate(c.id);
  };

  return (
    <Card className="border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="text-2xl">BD jobs helper</CardTitle>
        <CardDescription className="text-neutral-400">
          <span className="text-neutral-200">Target companies</span> live in the database (admin only). Use{" "}
          <span className="text-neutral-200">Jobs</span> to pull a board and import draft roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={bdSubTab} onValueChange={(v) => setBdSubTab(v as "company" | "jobs")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              Company
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <ListPlus className="w-4 h-4 shrink-0" />
              Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6 mt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Target Companies</h3>
                <p className="text-sm text-neutral-400">
                  {companiesLoading ? "Loading…" : `${companies.length} compan${companies.length === 1 ? "y" : "ies"} tracked`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={parsingPending || companies.filter((c) => c.status === "pending").length === 0}
                  onClick={handleParseNewlyAdded}
                >
                  {parsingPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Parse Newly Added Jobs
                    </>
                  )}
                </Button>
                <Button type="button" onClick={() => setAddOpen(true)}>
                  Add Company
                </Button>
              </div>
            </div>

            {companiesError && (
              <p className="text-sm text-red-400" role="alert">
                {(companiesError as Error).message}. If the table is missing, run{" "}
                <code className="text-neutral-300">supabase db push</code> for migration{" "}
                <code className="text-neutral-300">20260404120000_create_bd_companies</code>.
              </p>
            )}

            {companiesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
              </div>
            ) : companies.length === 0 ? (
              <p className="text-sm text-neutral-500 py-6">No target companies yet. Click Add Company.</p>
            ) : (
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead>Company</TableHead>
                      <TableHead>ATS Platform</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Parsed</TableHead>
                      <TableHead className="w-[100px] text-right"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c.id} className="border-neutral-800">
                        <TableCell className="align-top max-w-[280px]">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <a
                            href={c.careers_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-neutral-500 hover:text-blue-400 break-all line-clamp-2 inline-flex items-start gap-1 mt-1"
                          >
                            <span className="break-all">{c.careers_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => goToJobsWithCompany(c)}
                            className="block text-xs text-blue-400 hover:underline mt-1.5 text-left"
                          >
                            Open in Jobs tab
                          </button>
                        </TableCell>
                        <TableCell className="align-top">
                          {c.ats_platform ? (
                            <Badge variant="outline" className={`font-normal ${atsBadgeClass(c.ats_platform)}`}>
                              {atsLabel(c.ats_platform)}
                            </Badge>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right align-top font-mono text-neutral-200">{c.jobs_count}</TableCell>
                        <TableCell className="align-top">
                          {c.status === "parsed" && (
                            <Badge className="bg-neutral-900 text-neutral-100 border border-neutral-600">Parsed</Badge>
                          )}
                          {c.status === "pending" && (
                            <Badge variant="secondary" className="bg-amber-950/50 text-amber-200 border border-amber-900/60">
                              Pending
                            </Badge>
                          )}
                          {c.status === "error" && (
                            <Badge variant="destructive" className="font-normal">
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm text-neutral-400 whitespace-nowrap">
                          {formatLastParsed(c.last_parsed_at)}
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            disabled={deleteMut.isPending}
                            onClick={() => confirmDelete(c)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogContent className="bg-neutral-950 border-neutral-800 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add target company</DialogTitle>
                  <DialogDescription>Display name and public careers / job board URL. ATS is detected from the URL.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="bd-new-name">Company name</Label>
                    <Input
                      id="bd-new-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Mercari"
                      className="bg-neutral-900 border-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bd-new-url">Careers URL</Label>
                    <Input
                      id="bd-new-url"
                      value={newCareersUrl}
                      onChange={(e) => setNewCareersUrl(e.target.value)}
                      placeholder="https://jobs.lever.co/company"
                      className="bg-neutral-900 border-neutral-700"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!newName.trim() || !newCareersUrl.trim() || createMut.isPending}
                    onClick={() => createMut.mutate()}
                  >
                    {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-0">
            <p className="text-sm text-neutral-400">
              Paste a public careers URL (Lever, Greenhouse, Teamtailor, HRMOS). Workable often blocks the browser—prefer
              Greenhouse/Lever when possible.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="careers-url">Careers / board URL</Label>
                <Input
                  id="careers-url"
                  placeholder="https://job-boards.greenhouse.io/company"
                  value={careersUrl}
                  onChange={(e) => setCareersUrl(e.target.value)}
                  className="bg-neutral-950 border-neutral-700"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-name">Company name (for imported roles)</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-neutral-950 border-neutral-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleFetch} disabled={fetching || !careersUrl.trim()}>
                {fetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fetch listings
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>
                Open jobs board
              </Button>
              <Button type="button" variant="ghost" className="text-neutral-400" onClick={() => setBdSubTab("company")}>
                Back to companies
              </Button>
            </div>

            {parseMeta && (
              <p className="text-sm text-neutral-400">
                Detected <span className="text-neutral-200">{parseMeta.platform}</span> · slug{" "}
                <code className="text-neutral-300">{parseMeta.slug}</code> · {jobs.length} listing
                {jobs.length === 1 ? "" : "s"}
              </p>
            )}

            {parseError && (
              <p className="text-sm text-red-400" role="alert">
                {parseError}
              </p>
            )}

            {jobs.length > 0 && (
              <div className="rounded-md border border-neutral-800 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="w-[100px]">Link</TableHead>
                      <TableHead className="w-[140px] text-right">Import</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.external_id} className="border-neutral-800">
                        <TableCell className="font-medium max-w-[240px]">{job.title}</TableCell>
                        <TableCell className="text-neutral-400 whitespace-nowrap">{job.location || "—"}</TableCell>
                        <TableCell className="text-neutral-400 max-w-[160px] truncate">{job.department || "—"}</TableCell>
                        <TableCell>
                          {job.hosted_url ? (
                            <a
                              href={job.hosted_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-400 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="sr-only">Open posting</span>
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={importingId === job.external_id}
                            onClick={() => handleImport(job)}
                          >
                            {importingId === job.external_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Draft"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
