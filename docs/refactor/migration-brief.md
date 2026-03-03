# Architecture and Migration Brief

Date: 2026-01-31

## Current Stack Assessment

Current stack remains viable:

- Vite + React + React Router + TanStack Query + Supabase.
- Good fit for current product velocity and team familiarity.
- Main issues are architectural consistency and query/render discipline, not a hard platform limit.

## Option Analysis

## Option A: Keep Current Stack (Recommended Now)

### What changes

- Continue incremental refactors:
  - strict service/query boundary
  - feature-folder organization
  - route-aware data loading discipline
  - targeted backend RPC improvements

### Benefits

- Lowest migration risk.
- Fastest path to measurable wins.
- No rewrite tax.

### Costs/Risks

- Requires engineering discipline and code review standards.
- Benefits arrive incrementally rather than in one platform jump.

### Expected impact

- Short term: reduced network chatter and re-render overhead.
- Medium term: improved maintainability and contributor onboarding.

## Option B: Partial Migration to Data Routers (React Router loaders/actions)

### What changes

- Introduce route-level loaders/actions for high-traffic pages:
  - jobs list/detail
  - tracks/course detail
  - admin dashboard tabs

### Benefits

- Cleaner data ownership per route.
- Better SSR-readiness if needed later.
- Stronger preloading semantics.

### Costs/Risks

- Medium migration complexity; mixed patterns during transition.
- Requires careful TanStack Query interop strategy.

### Expected impact

- Better routing/data cohesion and predictable fetch timing.

## Option C: Move to Next.js (SSR/Hybrid)

### What changes

- Rebuild routing and data lifecycle around Next App Router.
- Rework auth/session and Supabase integration patterns.

### Benefits

- SSR/edge rendering options for improved first-paint on SEO/public pages.
- Unified server/client model.

### Costs/Risks

- High migration effort and regression risk.
- Significant QA burden for admin workflows.
- Requires route-by-route rewrite and infrastructure changes.

### Expected impact

- Potential first-load gains on public pages, but likely overkill for current stage unless SEO/SSR is a hard requirement.

## Recommendation

Choose **Option A now** with one focused backend enhancement:

- add a batched Kanban RPC endpoint to replace stage fanout.

Re-evaluate Option B after 2-3 refactor iterations when the service/query boundary is stable.
Defer Option C unless product requirements explicitly demand SSR-first behavior.

## POC Shortlist (if requested)

1. Route-loader POC for `/jobs` and `/job/:slug`.
2. Batched Kanban RPC + single-query UI consumption.
3. Feature-folder pilot for `roles` domain (`components`, `queries`, `services`, `types`).
