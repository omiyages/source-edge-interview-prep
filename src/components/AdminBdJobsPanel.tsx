// ABOUTME: BD helper — Target companies (Supabase) + Jobs tab (ATS fetch / draft import)
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseJobsFromCareersUrl } from "@/lib/ats/parseCareersUrl";
import { isApplyWorkableHost, WORKABLE_USE_JOBS_BOARD_URL } from "@/lib/ats/workableHints";
import type { ParsedJob } from "@/lib/ats/types";
import { createRole, fetchActiveAtsRolesForCompany, fetchExistingAtsExternalIds, updateRole } from "@/services/rolesService";
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
import { stripAllHtml } from "@/utils/xssProtection";
import { SecureRichTextDisplay } from "@/components/SecureRichTextDisplay";
import { Building2, ExternalLink, ListPlus, Loader2, RefreshCw } from "lucide-react";
import { clerkSupabaseClient } from "@/lib/clerk";
import { useClerkSupabase } from "@/hooks/useClerkSupabase";

const BD_COMPANIES_QK = ["bd-companies"] as const;

/** Parsed listing + company name for import (batch parse may mix several boards). */
type ListedJob = ParsedJob & { import_company: string; import_ats_platform: string | null };

type BdCompanyJobRow = {
  company: string;
  ats_platform: string;
  external_id: string;
  hosted_url: string | null;
  title: string;
  description_plain: string | null;
  location: string | null;
  department: string | null;
  team: string | null;
  commitment: string | null;
  workplace_type: string | null;
  japanese_level: ParsedJob["japanese_level"];
  role_category: string | null;
  tech_stack: string | null;
  translation_status: "pending" | "done" | "error" | "skipped";
  title_ja: string | null;
  description_plain_ja: string | null;
  location_ja: string | null;
  commitment_ja: string | null;
};

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function looksJapanese(s: string): boolean {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(s);
}

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

function toRoleDraft(job: ListedJob, company: string): RoleFormData {
  const jpTitle = (job.title || "").trim();
  const jpDesc = (job.description_plain || "").trim();
  const jpLoc = (job.location || "").trim() || null;
  const jpCommit = (job.commitment || "").trim() || null;
  // AI translation is triggered explicitly from the Jobs tab; do not auto-translate on import.

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

    ats_platform: job.import_ats_platform,
    ats_external_id: job.external_id,
    ats_hosted_url: job.hosted_url,

    job_title_ja: jpTitle || null,
    job_description_ja: jpDesc || null,
    location_ja: jpLoc,
    commitment_ja: jpCommit,

    translation_status: "skipped",
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

function cityFromLocation(location: string | null): string {
  const raw = (location ?? "").trim();
  if (!raw) return "—";

  // Common: "Ota-ku, Tokyo, Japan" → "Tokyo"
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  const jpPrefOrCity = /(?:東京都|大阪府|京都府|北海道|.{2,3}県)/;
  if (parts.length >= 2) {
    // Prefer the middle segment when it's a common city/prefecture token.
    const middle = parts[1];
    if (jpPrefOrCity.test(middle) || /^[A-Za-z .'-]+$/.test(middle)) return middle;
  }

  // Japanese-only strings (no commas), heuristics.
  if (jpPrefOrCity.test(raw)) {
    const m = raw.match(jpPrefOrCity);
    if (m?.[0]) return m[0];
  }

  // Fallback to first segment.
  return parts[0] ?? raw;
}

interface AdminBdJobsPanelProps {
  userId: string;
}

export function AdminBdJobsPanel({ userId }: AdminBdJobsPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshClient } = useClerkSupabase();

  const [bdSubTab, setBdSubTab] = useState<"company" | "jobs">("company");
  const [companySubTab, setCompanySubTab] = useState<"targets" | "closed">("targets");
  const [closedCompanyName, setClosedCompanyName] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCareersUrl, setNewCareersUrl] = useState("");
  const [parsingPending, setParsingPending] = useState(false);

  const [careersUrl, setCareersUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  /** `company:external_id` so batch rows stay distinct while importing. */
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [parseMeta, setParseMeta] = useState<{ platform: string; slug: string } | null>(null);
  const [jobs, setJobs] = useState<ListedJob[]>([]);
  const [importedAtsKeys, setImportedAtsKeys] = useState<Set<string>>(new Set());
  /** Latest-run discoveries only (clears on refresh / next parse). */
  const [latestNewKeys, setLatestNewKeys] = useState<Set<string>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<ListedJob | null>(null);
  const [aiPending, setAiPending] = useState(false);

  const inferredSingleCompany =
    jobs.length > 0
      ? new Set(jobs.map((j) => (j.import_company || "").trim()).filter(Boolean)).size === 1
        ? (jobs[0]?.import_company || "").trim()
        : ""
      : "";
  const aiCompany = (companyName.trim() && companyName.trim() !== "—" ? companyName.trim() : inferredSingleCompany) || "";

  const loadPersistedJobs = useCallback(async () => {
    // Re-sync Clerk → Supabase JWT before large reads. Long parses / many AI clicks can expire the token;
    // without a fresh JWT PostgREST returns 401 for admin-only `bd_company_jobs`.
    await refreshClient();
    const q = () =>
      clerkSupabaseClient
        .from("bd_company_jobs")
        .select(
          "company, ats_platform, external_id, hosted_url, title, description_plain, location, department, team, commitment, workplace_type, japanese_level, role_category, tech_stack, translation_status, title_ja, description_plain_ja, location_ja, commitment_ja, is_open",
        )
        .order("updated_at", { ascending: false })
        .limit(1000);

    let { data, error } = await q();
    if (error) {
      await refreshClient();
      ({ data, error } = await q());
    }
    if (error) throw new Error(`Failed to load saved jobs: ${error.message}`);

    const listed: ListedJob[] = (data || [])
      .filter((r: any) => r?.is_open !== false)
      .map((r: any) => ({
        external_id: String(r.external_id),
        title: String(r.title),
        location: r.location ?? null,
        department: r.department ?? null,
        team: r.team ?? null,
        commitment: r.commitment ?? null,
        workplace_type: r.workplace_type ?? null,
        hosted_url: r.hosted_url ?? null,
        description_plain: r.description_plain ?? null,
        japanese_level: (r.japanese_level ?? null) as any,
        role_category: r.role_category ?? null,
        tech_stack: r.tech_stack ?? null,
        import_company: String(r.company ?? "—"),
        import_ats_platform: (r.ats_platform ?? null) as string | null,
      }));

    setJobs(listed);
    setImportedAtsKeys(new Set());
  }, [refreshClient]);

  // Persisted-first: whenever the user enters the Jobs tab, auto-load saved jobs.
  useEffect(() => {
    if (bdSubTab !== "jobs") return;
    // Best-effort: don’t block UI if load fails.
    loadPersistedJobs().catch(() => {});
  }, [bdSubTab, loadPersistedJobs]);

  const triggerAiTranslate = useCallback(async () => {
    const company = aiCompany;
    if (!company) {
      toast({ variant: "destructive", title: "Company name required", description: "Enter company name first." });
      return;
    }
    setAiPending(true);
    try {
      await refreshClient();
      const { data, error } = await clerkSupabaseClient.functions.invoke<{ success?: boolean; translated?: number; error?: string }>(
        "translate-bd-company-jobs",
        { body: { company, limit: 80 } },
      );
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "AI translate failed");
      toast({ title: "AI translation done", description: `${data.translated ?? 0} jobs translated.` });
      await loadPersistedJobs();
    } catch (e) {
      toast({ variant: "destructive", title: "AI translation failed", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setAiPending(false);
    }
  }, [aiCompany, loadPersistedJobs, refreshClient, toast]);

  const persistBdJobs = useCallback(async (listed: ListedJob[]) => {
    if (listed.length === 0) return;
    const rows: BdCompanyJobRow[] = listed
      .map((j) => {
        const company = (j.import_company || "").trim();
        const platform = (j.import_ats_platform || "").trim();
        if (!company || !platform) return null;

        const titleJa = j.title?.trim() || null;
        const descJa = j.description_plain?.trim() || null;
        const locJa = j.location?.trim() || null;
        const commitJa = j.commitment?.trim() || null;
        const needsTranslation = looksJapanese([titleJa ?? "", descJa ?? "", locJa ?? "", commitJa ?? ""].join("\n"));

        return {
          company,
          ats_platform: platform,
          external_id: String(j.external_id ?? "").trim(),
          hosted_url: j.hosted_url ?? null,
          title: j.title ?? "",
          description_plain: j.description_plain ?? null,
          location: j.location ?? null,
          department: j.department ?? null,
          team: j.team ?? null,
          commitment: j.commitment ?? null,
          workplace_type: j.workplace_type ?? null,
          japanese_level: j.japanese_level,
          role_category: j.role_category ?? null,
          tech_stack: j.tech_stack ?? null,
          translation_status: needsTranslation ? "pending" : "skipped",
          title_ja: titleJa,
          description_plain_ja: descJa,
          location_ja: locJa,
          commitment_ja: commitJa,
        } satisfies BdCompanyJobRow;
      })
      .filter(Boolean) as BdCompanyJobRow[];

    if (rows.length === 0) return;

    // Guard against empty identity fields (these cause hard-to-diagnose PostgREST 400s).
    const validRows = rows.filter((r) => r.company && r.ats_platform && r.external_id && r.title);
    if (validRows.length === 0) return;

    const { data, error } = await clerkSupabaseClient.functions.invoke<{
      success?: boolean;
      upserted?: number;
      error?: string;
      code?: string | null;
      hint?: string | null;
      details?: string | null;
    }>("persist-bd-company-jobs", { body: { rows: validRows } });

    if (error) throw new Error(error.message);
    if (!data?.success) {
      const extra = [data?.code, data?.hint, data?.details].filter(Boolean).join(" | ");
      throw new Error(`Failed to persist BD jobs: ${data?.error || "unknown error"}${extra ? ` (${extra})` : ""}`);
    }
  }, []);

  const {
    data: companies = [],
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery({
    queryKey: BD_COMPANIES_QK,
    queryFn: listBdCompanies,
  });

  const { data: recentlyClosed = [], isLoading: recentlyClosedLoading } = useQuery({
    queryKey: ["bd-recently-closed", closedCompanyName] as const,
    enabled: Boolean(closedCompanyName.trim()),
    queryFn: async () => {
      const { data, error } = await clerkSupabaseClient
        .from("bd_recently_closed_jobs")
        .select("company, ats_platform, ats_external_id, ats_hosted_url, job_title_ja, job_title_en, closed_at")
        .eq("company", closedCompanyName.trim())
        .order("closed_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Array<{
        company: string;
        ats_platform: string;
        ats_external_id: string;
        ats_hosted_url: string | null;
        job_title_ja: string | null;
        job_title_en: string | null;
        closed_at: string;
      }>;
    },
  });

  const invalidateCompanies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BD_COMPANIES_QK });
  }, [queryClient]);

  const createMut = useMutation({
    mutationFn: () =>
      createBdCompany({
        name: newName.trim(),
        careers_url: newCareersUrl.trim(),
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
    if (companies.length === 0) {
      toast({ title: "No companies", description: "Add a target company first, then run parse." });
      return;
    }
    const toParse = companies;
    setParsingPending(true);
    let ok = 0;
    let fail = 0;
    const workableApplyZeroNames: string[] = [];
    const accumulated: ListedJob[] = [];
    const newKeysThisRun = new Set<string>();
    let lastMeta: { platform: string; slug: string } | null = null;
    const now = new Date().toISOString();
    // Reset latest-run “New” badges.
    setLatestNewKeys(new Set());
    for (const row of toParse) {
      try {
        const result = await parseJobsFromCareersUrl(row.careers_url);
        if (!result.success) {
          await updateBdCompanyParseResult(row.id, {
            jobs_count: 0,
            status: "error",
            last_parsed_at: now,
            ats_platform: result.platform ?? row.ats_platform,
          });
          fail += 1;
          continue;
        }
        if (
          result.jobs.length === 0 &&
          result.platform === "workable" &&
          isApplyWorkableHost(row.careers_url)
        ) {
          workableApplyZeroNames.push(row.name);
        }
        await updateBdCompanyParseResult(row.id, {
          jobs_count: result.jobs.length,
          status: "parsed",
          last_parsed_at: now,
          ats_platform: result.platform ?? row.ats_platform,
        });
        ok += 1;
        const nameForImport = row.name.trim();
        const platform = (result.platform ?? row.ats_platform ?? "").trim();

        // Compute “New” keys by diffing against already persisted jobs (before upsert).
        if (nameForImport && platform) {
          try {
            const { data: existing, error: existingErr } = await clerkSupabaseClient
              .from("bd_company_jobs")
              .select("external_id")
              .eq("company", nameForImport)
              .eq("ats_platform", platform);
            if (!existingErr) {
              const existingIds = new Set<string>((existing || []).map((r: any) => String(r.external_id)));
              result.jobs.forEach((j) => {
                const id = String(j.external_id);
                if (!existingIds.has(id)) newKeysThisRun.add(`${nameForImport}:${platform}:${id}`);
              });
            }
          } catch {
            // Ignore “New” computation failures; should not block parsing.
          }
        }

        if (platform) {
          try {
            const currentExternalIds = new Set(result.jobs.map((j) => j.external_id));
            const active = await fetchActiveAtsRolesForCompany({ company: nameForImport, ats_platform: platform });
            const missing = active.filter((r) => r.ats_external_id && !currentExternalIds.has(r.ats_external_id));
            if (missing.length > 0) {
              await clerkSupabaseClient.from("bd_recently_closed_jobs").upsert(
                missing.map((r) => ({
                  company: nameForImport,
                  ats_platform: platform,
                  ats_external_id: r.ats_external_id,
                  ats_hosted_url: r.ats_hosted_url,
                  job_title_ja: r.job_title_ja,
                  job_title_en: r.job_title,
                  closed_at: now,
                })),
                { onConflict: "company,ats_platform,ats_external_id" },
              );
              await Promise.all(missing.map((r) => updateRole(r.id, { status: "closed" })));
            }
          } catch {
            // best-effort; closed-job tracking shouldn't block parsing
          }
        }
        accumulated.push(
          ...result.jobs.map((j) => ({
            ...j,
            import_company: nameForImport || "Unknown company",
            import_ats_platform: result.platform ?? row.ats_platform ?? null,
          })),
        );
        if (result.platform && result.slug) {
          lastMeta = { platform: result.platform, slug: result.slug };
        }
      } catch (e) {
        await updateBdCompanyParseResult(row.id, {
          jobs_count: 0,
          status: "error",
          last_parsed_at: now,
        });
        fail += 1;
      }
    }
    invalidateCompanies();
    setParsingPending(false);

    setParseError(null);
    const distinctCompanies = new Set(accumulated.map((j) => j.import_company)).size;
    if (toParse.length === 1) {
      setCareersUrl(toParse[0].careers_url);
      setCompanyName(toParse[0].name.trim());
      setParseMeta(lastMeta);
    } else {
      setCareersUrl("");
      setCompanyName(distinctCompanies === 1 && accumulated[0] ? accumulated[0].import_company : "");
      setParseMeta(distinctCompanies <= 1 ? lastMeta : null);
    }

    if (accumulated.length > 0) {
      setBdSubTab("jobs");
    }

    // Persist parsed listings so refresh doesn't wipe the Jobs tab.
    try {
      await persistBdJobs(accumulated);
    } catch (e) {
      // If persistence fails, still show parsed results so the user can proceed.
      toast({
        variant: "destructive",
        title: "Could not save parsed jobs",
        description: e instanceof Error ? e.message : String(e),
        duration: 10_000,
      });
      setJobs(accumulated);
    }

    // Source of truth: show persisted jobs after parse.
    try {
      await loadPersistedJobs();
    } catch {
      // Fallback: if persistence/query fails, still show what we just parsed.
      setJobs(accumulated);
    }

    // Expose “New” badges for latest parse run only.
    setLatestNewKeys(newKeysThisRun);

    // Best-effort: mark already-imported jobs (disable import button).
    try {
      const groups = new Map<string, { company: string; platform: string; ids: string[] }>();
      for (const j of accumulated) {
        const c = (j.import_company || "").trim();
        const p = (j.import_ats_platform || "").trim();
        if (!c || !p) continue;
        const k = `${c}:::${p}`;
        const g = groups.get(k) ?? { company: c, platform: p, ids: [] };
        g.ids.push(j.external_id);
        groups.set(k, g);
      }

      const entries = await Promise.all(
        [...groups.values()].map(async (g) => {
          const existing = await fetchExistingAtsExternalIds({
            company: g.company,
            ats_platform: g.platform,
            external_ids: g.ids,
          });
          const keys: string[] = [];
          existing.forEach((id) => keys.push(`${g.company}:${g.platform}:${id}`));
          return keys;
        }),
      );

      const merged = new Set<string>();
      entries.flat().forEach((k) => merged.add(k));
      setImportedAtsKeys(merged);
    } catch {
      // ignore
    }

    const base = `${ok} succeeded, ${fail} failed (${toParse.length} compan${toParse.length === 1 ? "y" : "ies"}).`;
    const jobsHint =
      accumulated.length > 0
        ? ` Opened Jobs tab with ${accumulated.length} listing${accumulated.length === 1 ? "" : "s"}.`
        : "";
    if (workableApplyZeroNames.length > 0) {
      toast({
        title: "Parse finished",
        description: `${base}${jobsHint} ${workableApplyZeroNames.join(", ")}: ${WORKABLE_USE_JOBS_BOARD_URL}`,
        duration: 14_000,
      });
    } else {
      toast({ title: "Parse finished", description: `${base}${jobsHint}` });
    }
  }, [companies, invalidateCompanies, loadPersistedJobs, persistBdJobs, toast]);

  const goToJobsWithCompany = useCallback((c: BdCompanyRow) => {
    setCompanyName(c.name);
    setCareersUrl(c.careers_url);
    setJobs([]);
    setParseMeta(null);
    setParseError(null);
    setBdSubTab("jobs");
    toast({ title: "Jobs tab", description: `Prefilled: ${c.name}` });
  }, [toast]);

  const goToClosedWithCompany = useCallback((c: BdCompanyRow) => {
    setClosedCompanyName(c.name.trim());
    setCompanySubTab("closed");
    setBdSubTab("company");
  }, []);

  const handleImport = useCallback(
    async (job: ListedJob): Promise<boolean> => {
      const company = (job.import_company || "").trim() || companyName.trim();
      if (!company || company === "—") {
        toast({ variant: "destructive", title: "Company name required", description: "Used for the role record and slug." });
        return false;
      }

      const rowKey = `${job.import_company}:${job.external_id}`;
      setImportingKey(rowKey);
      try {
        const platform = job.import_ats_platform?.trim() || null;
        if (platform) {
          const atsKey = `${company}:${platform}:${job.external_id}`;
          if (importedAtsKeys.has(atsKey)) {
            toast({ title: "Already imported", description: job.title });
            return true;
          }
        }
        await createRole(toRoleDraft(job, company), userId);
        if (platform) {
          setImportedAtsKeys((prev) => {
            const next = new Set(prev);
            next.add(`${company}:${platform}:${job.external_id}`);
            return next;
          });
        }
        toast({ title: "Draft role created", description: job.title });
        return true;
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: e instanceof Error ? e.message : String(e),
        });
        return false;
      } finally {
        setImportingKey(null);
      }
    },
    [companyName, importedAtsKeys, userId, toast],
  );

  const confirmDelete = (c: BdCompanyRow) => {
    if (typeof window !== "undefined" && !window.confirm(`Remove “${c.name}” from target companies?`)) return;
    deleteMut.mutate(c.id);
  };

  const batchCompanyCount = jobs.length > 0 ? new Set(jobs.map((j) => j.import_company)).size : 0;

  return (
    <Card className="border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="text-2xl">BD jobs helper</CardTitle>
        <CardDescription className="text-neutral-400">
          <span className="text-neutral-200">Target companies</span> live in the database (admin only).{" "}
          <span className="text-neutral-200">Parse newly added jobs</span> re-fetches every target company&apos;s board,
          updates counts, and opens the <span className="text-neutral-200">Jobs</span> tab with combined listings. You
          can also paste a URL on{" "}
          <span className="text-neutral-200">Jobs</span> and fetch manually.
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={companySubTab === "targets" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCompanySubTab("targets")}
                >
                  Target companies
                </Button>
                <Button
                  type="button"
                  variant={companySubTab === "closed" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCompanySubTab("closed")}
                >
                  Recently closed jobs
                </Button>
              </div>
            </div>

            {companySubTab === "closed" ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="closed-company">Company</Label>
                    <Input
                      id="closed-company"
                      placeholder="Stockmark"
                      value={closedCompanyName}
                      onChange={(e) => setClosedCompanyName(e.target.value)}
                      className="bg-neutral-950 border-neutral-700"
                    />
                    <p className="text-xs text-neutral-500">
                      Shows roles closed within the last 3 weeks (auto-cleaned).
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800 hover:bg-transparent">
                        <TableHead>Title</TableHead>
                        <TableHead>Closed</TableHead>
                        <TableHead className="w-[90px]">Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentlyClosedLoading ? (
                        <TableRow className="border-neutral-800">
                          <TableCell colSpan={3} className="text-sm text-neutral-500 py-6">
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : recentlyClosed.length === 0 ? (
                        <TableRow className="border-neutral-800">
                          <TableCell colSpan={3} className="text-sm text-neutral-500 py-6">
                            No recently closed jobs for this company.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentlyClosed.map((r) => (
                          <TableRow key={`${r.ats_platform}:${r.ats_external_id}`} className="border-neutral-800">
                            <TableCell className="text-neutral-200 max-w-[520px] truncate" title={r.job_title_en || r.job_title_ja || ""}>
                              {r.job_title_en || r.job_title_ja || "—"}
                            </TableCell>
                            <TableCell className="text-neutral-400 whitespace-nowrap">{formatLastParsed(r.closed_at)}</TableCell>
                            <TableCell>
                              {r.ats_hosted_url ? (
                                <a
                                  href={r.ats_hosted_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="sr-only">Open posting</span>
                                </a>
                              ) : (
                                <span className="text-neutral-500">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            {companySubTab === "targets" ? (
              <>
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
                  disabled={parsingPending || companiesLoading}
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
                {(companiesError as Error).message}. Confirm the project&apos;s{" "}
                <code className="text-neutral-300">bd_companies</code> table exposes{" "}
                <code className="text-neutral-300">ats_url</code> (and that your Supabase types match).
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
                          <button
                            type="button"
                            onClick={() => goToClosedWithCompany(c)}
                            className="block text-xs text-neutral-300 hover:underline mt-1 text-left"
                          >
                            View recently closed
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
                    <DialogDescription>
                      Display name and public careers URL; ATS is detected from the URL.{" "}
                      <span className="text-neutral-400">{WORKABLE_USE_JOBS_BOARD_URL}</span>{" "}
                      <span className="text-neutral-400">HERP uses `https://herp.careers/v1/&lt;company&gt;`.</span>
                    </DialogDescription>
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
                      placeholder="https://herp.careers/v1/stockmark"
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
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-0">
            <p className="text-sm text-neutral-400">
              Paste a public careers URL (Lever, Greenhouse, Teamtailor, HRMOS, HERP).{" "}
              <span className="text-neutral-300">Workable:</span> {WORKABLE_USE_JOBS_BOARD_URL}{" "}
              <span className="text-neutral-300">HERP:</span> Use the `https://herp.careers/v1/&lt;company&gt;` URL.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="careers-url">Careers / board URL</Label>
                <Input
                  id="careers-url"
                  placeholder="https://herp.careers/v1/stockmark (or https://jobs.workable.com/company/…)"
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
              <Button type="button" variant="secondary" onClick={triggerAiTranslate} disabled={aiPending}>
                {aiPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Triggering AI…
                  </>
                ) : (
                  "Trigger AI"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>
                Open jobs board
              </Button>
              <Button type="button" variant="ghost" className="text-neutral-400" onClick={() => setBdSubTab("company")}>
                Back to companies
              </Button>
            </div>

            {jobs.length > 0 && (
              <p className="text-sm text-neutral-400">
                {batchCompanyCount > 1 ? (
                  <>
                    Batch from <span className="text-neutral-200">{batchCompanyCount}</span> companies ·{" "}
                    {jobs.length} listing{jobs.length === 1 ? "" : "s"}
                  </>
                ) : parseMeta ? (
                  <>
                    Detected <span className="text-neutral-200">{parseMeta.platform}</span> · slug{" "}
                    <code className="text-neutral-300">{parseMeta.slug}</code> · {jobs.length} listing
                    {jobs.length === 1 ? "" : "s"}
                  </>
                ) : (
                  <>
                    {jobs.length} listing{jobs.length === 1 ? "" : "s"}{" "}
                    {jobs[0]?.import_company ? (
                      <>
                        · <span className="text-neutral-200">{jobs[0].import_company}</span>
                      </>
                    ) : null}
                  </>
                )}
              </p>
            )}

            {parseError && (
              <p className="text-sm text-red-400" role="alert">
                {parseError}
              </p>
            )}

            {jobs.length > 0 && (
              <div className="rounded-md border border-neutral-800 overflow-x-auto">
                <p className="text-xs text-neutral-500 px-3 py-2 border-b border-neutral-800">
                  Click a row to preview the full posting. Use Draft to import without opening the preview.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>JP</TableHead>
                      <TableHead>Tech</TableHead>
                      <TableHead className="w-[100px]">Link</TableHead>
                      <TableHead className="w-[140px] text-right">Import</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      (() => {
                        const company = (job.import_company || "").trim();
                        const platform = (job.import_ats_platform || "").trim();
                        const atsKey = company && platform ? `${company}:${platform}:${job.external_id}` : null;
                        const isImported = atsKey ? importedAtsKeys.has(atsKey) : false;
                    const isNew = atsKey ? latestNewKeys.has(atsKey) : false;
                        const rowKey = `${job.import_company}:${job.external_id}`;

                        return (
                      <TableRow
                        key={rowKey}
                        tabIndex={0}
                        className="border-neutral-800 cursor-pointer hover:bg-neutral-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded-sm"
                        aria-label={`Preview job: ${job.title}`}
                        onClick={() => setPreviewJob(job)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPreviewJob(job);
                          }
                        }}
                      >
                        <TableCell className="text-neutral-300 max-w-[140px] truncate" title={job.import_company}>
                          {job.import_company}
                        </TableCell>
                        <TableCell className="font-medium max-w-[240px] text-left">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{job.title}</span>
                            {isNew ? (
                              <Badge className="bg-emerald-950/50 text-emerald-200 border border-emerald-800/60">
                                New
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-neutral-400 whitespace-nowrap"
                          title={job.location || ""}
                        >
                          {cityFromLocation(job.location)}
                        </TableCell>
                        <TableCell className="text-neutral-400 max-w-[160px] truncate">{job.department || "—"}</TableCell>
                        <TableCell className="text-neutral-400 whitespace-nowrap">
                          {job.japanese_level && job.japanese_level !== "None" ? job.japanese_level : "—"}
                        </TableCell>
                        <TableCell className="text-neutral-400 max-w-[200px] truncate" title={job.tech_stack || ""}>
                          {job.tech_stack && job.tech_stack !== "N/A" ? job.tech_stack : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={isImported || importingKey === rowKey}
                            onClick={() => handleImport(job)}
                          >
                            {importingKey === rowKey ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isImported ? (
                              "Imported"
                            ) : (
                              "Draft"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                        );
                      })()
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Dialog open={previewJob !== null} onOpenChange={(open) => !open && setPreviewJob(null)}>
              <DialogContent className="bg-neutral-950 border-neutral-800 max-w-2xl max-h-[min(90vh,720px)] flex flex-col gap-0 p-0">
                {previewJob && (
                  <>
                    <DialogHeader className="p-6 pb-3 space-y-2 shrink-0 border-b border-neutral-800">
                      <DialogTitle className="text-lg text-left pr-8">{previewJob.title}</DialogTitle>
                      <DialogDescription asChild>
                        <div className="text-left text-neutral-400 text-sm space-y-1">
                          <div>
                            <span className="text-neutral-500">Company</span>{" "}
                            <span className="text-neutral-200">{previewJob.import_company}</span>
                          </div>
                          {(previewJob.location || previewJob.department || previewJob.workplace_type) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {previewJob.location ? <span>{previewJob.location}</span> : null}
                              {previewJob.department ? <span>Team: {previewJob.department}</span> : null}
                              {previewJob.workplace_type ? <span>{previewJob.workplace_type}</span> : null}
                            </div>
                          )}
                          {(previewJob.role_category || previewJob.tech_stack) && (
                            <div className="text-neutral-500 text-xs">
                              {[previewJob.role_category, previewJob.tech_stack].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          {previewJob.japanese_level && previewJob.japanese_level !== "None" ? (
                            <div className="text-neutral-500 text-xs">Japanese: {previewJob.japanese_level}</div>
                          ) : null}
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                      {previewJob.description_plain?.trim() ? (
                        looksLikeHtml(previewJob.description_plain) ? (
                          <SecureRichTextDisplay
                            content={previewJob.description_plain}
                            className="text-sm text-neutral-300 prose-invert prose-p:text-neutral-300 prose-headings:text-neutral-200"
                          />
                        ) : (
                          <div className="text-sm text-neutral-300 whitespace-pre-wrap break-words">
                            {stripAllHtml(previewJob.description_plain)}
                          </div>
                        )
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No description text was returned for this listing. Open the original posting to read the full
                          job page.
                        </p>
                      )}
                    </div>
                    <DialogFooter className="p-4 sm:p-6 border-t border-neutral-800 gap-2 flex-col sm:flex-row sm:justify-end shrink-0">
                      {previewJob.hosted_url ? (
                        <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                          <a href={previewJob.hosted_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Original posting
                          </a>
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" onClick={() => setPreviewJob(null)} className="w-full sm:w-auto">
                        Close
                      </Button>
                      <Button
                        type="button"
                        disabled={
                          (() => {
                            const company = (previewJob.import_company || "").trim();
                            const platform = (previewJob.import_ats_platform || "").trim();
                            const atsKey = company && platform ? `${company}:${platform}:${previewJob.external_id}` : null;
                            const isImported = atsKey ? importedAtsKeys.has(atsKey) : false;
                            return isImported || importingKey === `${previewJob.import_company}:${previewJob.external_id}`;
                          })()
                        }
                        onClick={async () => {
                          const ok = await handleImport(previewJob);
                          if (ok) setPreviewJob(null);
                        }}
                        className="w-full sm:w-auto"
                      >
                        {importingKey === `${previewJob.import_company}:${previewJob.external_id}` ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing…
                          </>
                        ) : (() => {
                            const company = (previewJob.import_company || "").trim();
                            const platform = (previewJob.import_ats_platform || "").trim();
                            const atsKey = company && platform ? `${company}:${platform}:${previewJob.external_id}` : null;
                            const isImported = atsKey ? importedAtsKeys.has(atsKey) : false;
                            return isImported ? "Imported" : "Import as draft";
                          })()}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
