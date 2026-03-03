# Refactor Implementation Report

Date: 2026-01-31

## Scope Completed

Implemented a full-repo cleanup and incremental refactor focused on low-risk, high-impact improvements.

## Baseline Snapshot (Before)

- Build status: successful.
- Notable heavy chunks:
  - `ReportTab`: ~362.82 kB
  - `rich-text-editor`: ~250.18 kB
  - `KanbanBoard`: ~157.64 kB
  - `index`: ~156.86 kB
- Global startup prefetch executed on all routes in `src/App.tsx` for:
  - `questions-paginated`
  - `question-stats`
  - `courses`
- Known fetch-all patterns:
  - `src/pages/RoleDetail.tsx` fetched all courses with `attached_jobs`.
  - `src/components/CourseHeader.tsx` fetched all roles then filtered in memory.
- N+1 pattern:
  - `src/components/CourseCard.tsx` queried progress per card.

## Implemented Changes

### 1) Dead code and duplicate removal

Removed unused files and duplicate variants:

- `src/components/SessionTimeDisplay.tsx`
- `src/components/SocialLoginButtons.tsx`
- `src/pages/CandidatePool.tsx`
- `src/components/CandidatePoolDashboard.tsx`
- `src/services/candidatePoolService.ts`
- `src/components/PendingTasksSimple.tsx`
- `src/components/PendingTasksAlternative.tsx`
- `src/components/ManageStageResourcesForm.tsx`
- `src/components/ManageStageResourcesFormImproved.tsx`
- accidental artifact: `/.e`

Also updated resource management usage:

- `src/components/StageContentAssignment.tsx` now uses `ManageStageResourcesTable`.
- Removed stale imports from `src/pages/CourseDetail.tsx`.

### 2) Startup/query overfetch reduction

- Removed global prefetch block from `src/App.tsx`.
- Deferred admin question queries in `src/pages/AdminDashboard.tsx`:
  - only fetch when `questions` tab is active.
  - `all questions` query only runs inside `management` subtab.

### 3) Fetch-all pattern fixes

- `src/components/CourseHeader.tsx`
  - replaced full roles scan with targeted `.in('job_title', titles)` query.
- `src/pages/RoleDetail.tsx`
  - replaced all-courses scan with company-scoped lookup for recommended course.

### 4) Data-access boundary improvements

Added service layer and moved page/component Supabase access behind it:

- new: `src/services/coursesService.ts`
  - `fetchRecommendedCourseForRole()`
  - `fetchRoleLinksByJobTitles()`
- `RoleDetail` and `CourseHeader` now call service functions instead of direct Supabase.

### 5) Performance optimization pass

- Removed per-card progress query N+1:
  - `CourseCard` now accepts `progress` as prop.
  - `Track` now performs one aggregated progress query for all visible courses.
- Optimized Kanban CSV export:
  - `src/components/KanbanBoard.tsx` now reuses cached rejected dataset when available.
  - avoids extra RPC fanout when cache is warm.
- Reduced redundant role list invalidations:
  - `src/components/RoleCSVImport.tsx` removed delayed duplicate invalidate.
  - `src/components/RoleForm.tsx` no longer triggers second invalidation after AI summary call.

### 6) Repository hygiene and structure guardrails

- Removed root-level one-off debug/test/fix SQL/JS artifacts (`debug_*`, `test_*`, `fix_*.sql`).
- Added structure docs for future hygiene:
  - `scripts/sql/README.md`
  - `scripts/dev/README.md`
  - `ops/backups/README.md`

## Build/Validation (After)

- Build status: successful.
- Notable chunk differences after refactor:
  - `index`: ~156.86 kB -> ~153.75 kB
  - `CourseDetail`: ~42.90 kB -> ~42.94 kB (stable)
  - `Track`: ~30.29 kB -> ~30.56 kB (progress aggregation logic moved up)
- Lint check on edited files: no new lint errors.

## Structural Changes Summary

- Added service boundary:
  - `src/services/coursesService.ts`
- Added operational structure docs:
  - `scripts/sql/README.md`
  - `scripts/dev/README.md`
  - `ops/backups/README.md`
- Simplified feature surface by removing unused/legacy components and scripts.

## Remaining High-Value Next Steps

1. Move additional direct Supabase access from large pages/components (`Roles`, `UserDetailModal`, `KanbanBoard`) into service/query modules.
2. Introduce a single batched backend RPC for Kanban stage loading to eliminate 9-stage RPC fanout.
3. Split large components (`RoleDetail`, `Roles`, `UserDetailModal`) into smaller feature modules.
4. Add query-key and invalidation policy conventions in a shared query utility.
